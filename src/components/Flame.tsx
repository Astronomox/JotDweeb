"use client";

import { useEffect, useRef, useState } from "react";

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// Pixel-art fireball after the fbref references: a round base with flame
// tongues licking upward, four flat colour bands (red rim, orange-red, orange,
// yellow core sitting low), stray ember pixels rising above, and a stepped
// flicker like a sprite. Everything is snapped to a uGrid x uGrid pixel grid.
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform float uIntensity;
uniform float uGrid;

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
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  // Snap to the pixel grid, then work in cell-centre coordinates in [-1, 1].
  vec2 cell = floor(gl_FragCoord.xy / uRes * uGrid);
  vec2 q = (cell + 0.5) / uGrid * 2.0 - 1.0;
  // Sprite-style flicker: the fire advances in discrete frames.
  float t = floor(uTime * 9.0) / 9.0;

  float R = mix(0.5, 0.8, uIntensity);                  // radius of the round base
  float cy = -0.9 + R;                                  // base sits on the bottom edge
  float H = mix(0.4, 0.8, uIntensity) * (0.97 - cy);    // leaves headroom for embers
  float dy = q.y - cy;
  float h = clamp(dy / H, 0.0, 1.0);

  float heat;
  if (dy < 0.0) {
    heat = 1.0 - length(vec2(q.x, dy)) / R;             // round bottom
  } else {
    // Broad body that tapers slowly, like the references.
    float halfWidth = R * pow(1.0 - h, 0.55) + 0.001;
    heat = min(1.0 - abs(q.x) / halfWidth, 1.0 - h * 0.7);
  }
  // Separate tongues: each column flickers to its own height.
  float tongue = noise(vec2(q.x * 4.2, t * 1.6));
  heat += (tongue - 0.5) * 1.5 * h;
  // Churn so the bands break into ragged pixel edges.
  float n = fbm(vec2(q.x * 3.0, q.y * 2.0 - t * 2.4));
  heat += (n - 0.5) * (0.3 + 0.5 * h);
  // Keep the yellow core low in the flame, as in the references.
  heat -= 0.2 * h;

  vec3 red = vec3(0.91, 0.16, 0.08);
  vec3 orangeRed = vec3(1.0, 0.36, 0.0);
  vec3 orange = vec3(1.0, 0.6, 0.0);
  vec3 yellow = vec3(1.0, 0.9, 0.1);

  vec3 col = red;
  float alpha = step(0.02, heat);
  col = mix(col, orangeRed, step(0.18, heat));
  col = mix(col, orange, step(0.4, heat));
  col = mix(col, yellow, step(0.7, heat));

  // Ember pixels drifting up from the flame tip, one per chosen column.
  if (alpha < 0.5) {
    float lane = hash(vec2(cell.x, 3.7));
    float yStart = cy + H * 0.95;
    float travel = 1.0 - yStart;
    float ey = yStart + fract(lane * 5.3 + t * 0.7) * travel;
    float eCell = floor((ey + 1.0) * 0.5 * uGrid);
    if (lane > 0.55 && abs(q.x) < R * 0.6 && cell.y == eCell && uIntensity > 0.3) {
      col = red;
      alpha = 1.0;
    }
  }

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
 * A live pixel-art WebGL fireball. `intensity` (0–1) grows the fire; a cold streak
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
    const uGrid = gl.getUniformLocation(prog, "uGrid");

    const maxDim = (gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array)[0] || 4096;
    const px = Math.min(
      Math.round(size * (window.devicePixelRatio || 1) * SUPERSAMPLE),
      maxDim
    );
    canvas.width = px;
    canvas.height = px;
    gl.viewport(0, 0, px, px);
    gl.uniform2f(uRes, px, px);
    // Chunky pixels at every size: about one sprite pixel per 3.5 CSS px.
    gl.uniform1f(uGrid, Math.max(10, Math.min(16, Math.round(size / 3.5))));
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
    // No WebGL: the same four flat bands, as a static round flame.
    return (
      <span
        {...a11y}
        className={`inline-block rounded-full ${className}`}
        style={{
          width: size,
          height: size,
          background:
            "radial-gradient(circle at 50% 62%, #ffe61a 0 18%, #ff9900 18% 28%, #ff5c00 28% 37%, #e8291a 37% 45%, transparent 45%)",
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
