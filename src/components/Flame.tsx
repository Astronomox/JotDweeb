"use client";

import { useEffect, useRef, useState } from "react";

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// Procedural fireball: fbm turbulence in polar space streams outward from a
// white-hot core through gold and orange to an ember rim, with a flickering
// corona. Output is premultiplied alpha so it composites over the paper.
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform float uIntensity;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 6; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  // Centred, aspect-correct coordinates in [-1, 1].
  vec2 p = (gl_FragCoord.xy * 2.0 - uRes) / min(uRes.x, uRes.y);
  float r = length(p);
  float a = atan(p.y, p.x);
  float t = uTime;

  // Seamless angular coordinate: sample noise on a circle so there is no seam at +-PI.
  vec2 ring = vec2(cos(a), sin(a));
  float outward = r * 2.2 - t * 0.9;
  float n1 = fbm(ring * 2.2 + vec2(outward, t * 0.15));
  float n2 = fbm(ring * 4.5 + vec2(outward * 1.8 + 3.0, -t * 0.4));

  float radius = mix(0.52, 0.8, uIntensity);
  // Turbulent edge: flame tongues lick past the rim.
  float edge = radius + (n1 - 0.5) * 0.42 + (n2 - 0.5) * 0.18;
  float body = 1.0 - smoothstep(edge - 0.3, edge, r);

  // Surface churn inside the ball.
  float churn = fbm(p * 3.2 + vec2(t * 0.35, -t * 0.55));
  float heat = body * (0.65 + 0.55 * churn);
  heat += (1.0 - smoothstep(0.0, radius * 0.75, r)) * 0.55; // hot core
  heat = clamp(heat - n2 * 0.18 * r, 0.0, 1.0);

  vec3 ember = vec3(0.48, 0.10, 0.03);
  vec3 orange = vec3(0.93, 0.40, 0.08);
  vec3 gold = vec3(1.00, 0.74, 0.28);
  vec3 core = vec3(1.00, 0.96, 0.84);
  vec3 col = mix(ember, orange, smoothstep(0.0, 0.38, heat));
  col = mix(col, gold, smoothstep(0.38, 0.7, heat));
  col = mix(col, core, smoothstep(0.78, 1.0, heat) * (0.5 + 0.5 * uIntensity));

  // Soft corona glow beyond the rim.
  float glow = exp(-6.0 * max(r - radius * 0.9, 0.0)) * 0.35 * (0.6 + 0.4 * n1);
  float alpha = max(smoothstep(0.03, 0.3, heat), glow * (1.0 - body));
  // Fade to nothing inside the inscribed circle so the square canvas never shows.
  alpha *= 1.0 - smoothstep(0.82, 0.98, r);
  col = mix(orange, col, smoothstep(0.0, 0.3, heat));
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

// Backing-store pixels per device pixel. Rendering well above the display
// density and letting the browser downsample gives a supersampled, crisp edge.
const SUPERSAMPLE = 4;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn("Flame shader failed to compile:", gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

/**
 * A live WebGL fireball. `intensity` (0–1) grows the fire; a cold streak
 * renders as a small ember. Pauses when off screen and holds still for
 * reduced motion.
 */
export function Flame({
  size,
  intensity = 1,
  className = "",
  label,
}: {
  size: number;
  intensity?: number;
  className?: string;
  label?: string;
}) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const intensityRef = useRef(intensity);
  const redrawRef = useRef<() => void>(() => {});
  const [failed, setFailed] = useState(false);
  intensityRef.current = intensity;

  // Reduced motion draws a single frame, so repaint when intensity changes.
  useEffect(() => redrawRef.current(), [intensity]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    // A fresh canvas per effect run, so cleanup can release its context.
    // Otherwise every mount leaks a WebGL context and the browser starts
    // killing the oldest ones (blank flames) after a dozen or so view changes.
    const canvas = document.createElement("canvas");
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.style.display = "block";
    host.appendChild(canvas);

    const gl = canvas.getContext("webgl", {
      premultipliedAlpha: true,
      alpha: true,
      antialias: false,
    });
    const fail = () => {
      canvas.remove();
      setFailed(true);
    };
    if (!gl) return fail();

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) return fail();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return fail();
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uIntensity = gl.getUniformLocation(prog, "uIntensity");

    const maxDim = (gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array)[0] || 4096;
    const px = Math.min(
      Math.round(size * (window.devicePixelRatio || 1) * SUPERSAMPLE),
      maxDim
    );
    canvas.width = px;
    canvas.height = px;
    gl.viewport(0, 0, px, px);
    gl.uniform2f(uRes, px, px);
    gl.clearColor(0, 0, 0, 0);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let raf = 0;
    let visible = true;

    const draw = (now: number) => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      // Wrap time so float precision never degrades on long sessions.
      gl.uniform1f(uTime, reduced ? 2.4 : ((now - start) / 1000) % 1000);
      gl.uniform1f(uIntensity, intensityRef.current);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const loop = (now: number) => {
      draw(now);
      if (visible && !reduced) raf = requestAnimationFrame(loop);
    };
    redrawRef.current = () => {
      if (reduced) draw(performance.now());
    };

    const io = new IntersectionObserver(([entry]) => {
      const was = visible;
      visible = entry.isIntersecting;
      if (visible && !was && !reduced) raf = requestAnimationFrame(loop);
      if (!visible) cancelAnimationFrame(raf);
    });
    io.observe(canvas);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      redrawRef.current = () => {};
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
  }, [size]);

  const a11y = label
    ? { role: "img" as const, "aria-label": label }
    : { "aria-hidden": true };

  if (failed) {
    // No WebGL: a soft painted fireball rather than a vector icon.
    return (
      <span
        {...a11y}
        className={`inline-block rounded-full ${className}`}
        style={{
          width: size,
          height: size,
          background:
            "radial-gradient(circle at 50% 50%, #fff5d6 0%, #ffbd47 30%, #e8661a 55%, rgba(122,26,8,0) 72%)",
          opacity: 0.4 + 0.6 * intensity,
        }}
      />
    );
  }

  return (
    <span
      ref={hostRef}
      {...a11y}
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** Map a streak length onto flame intensity: ember at 0, full blaze by a week. */
export function streakIntensity(streak: number): number {
  if (streak <= 0) return 0.15;
  return Math.min(1, 0.45 + streak * 0.08);
}
