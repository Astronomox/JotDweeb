// Captures the fireball at a few frames and sizes. Run: node .shots/fireball.mjs [port]
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
const BASE = `http://localhost:${process.argv[2] || 3200}/`;
const port = 9357;
const proc = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", `--remote-debugging-port=${port}`, "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--hide-scrollbars", `--user-data-dir=${process.cwd()}/.shots/profile-fb`, "about:blank"], { stdio: "ignore" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 60; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await wait(250); } }
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0; const pending = new Map(); const logs = [];
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } if (m.method === "Runtime.exceptionThrown") logs.push("EXC " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text)); if (m.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(m.params.type)) logs.push(m.params.type + " " + m.params.args.map((a) => a.value ?? a.description).join(" ")); });
const ev = async (x) => (await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true })).result?.result?.value;
const shot = async (n, clip) => { const r = await send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 } }); writeFileSync(`.shots/${n}.png`, Buffer.from(r.result.data, "base64")); };
await send("Runtime.enable"); await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
await send("Page.navigate", { url: BASE });
for (let i = 0; i < 120 && !(await ev(`!!document.querySelector("aside canvas")`)); i++) await wait(1000);
await wait(1500);
console.log(await ev(`JSON.stringify({c: document.querySelectorAll("canvas").length, h1: document.querySelector("main h1")?.textContent, aside: !!document.querySelector("aside")})`), logs);
const box = await ev(`(() => { const r = document.querySelector('aside canvas').getBoundingClientRect(); return { x: r.x - 8, y: r.y - 8, width: r.width + 16, height: r.height + 16 }; })()`);
for (let f = 0; f < 3; f++) { await shot(`fireball-frame${f}`, box); await wait(350); }
await shot("fireball-sidebar", { x: 16, y: 120, width: 280, height: 90 });
await ev(`[...document.querySelectorAll('aside nav button')].find(b => b.textContent === 'Calendar').click()`); await wait(1000);
await shot("fireball-calendar", { x: 900, y: 40, width: 540, height: 120 });
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await wait(1500);
await shot("fireball-mobile", { x: 200, y: 0, width: 190, height: 60 });
console.log(JSON.stringify({ box, logs }, null, 1));
ws.close(); proc.kill(); process.exit(0);
