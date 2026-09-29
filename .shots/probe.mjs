import { spawn } from "node:child_process";
const port = 9334, wait = (ms) => new Promise((r) => setTimeout(r, ms));
const flags = process.argv.slice(2);
const proc = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${process.cwd()}/.shots/profile2`, ...flags, "about:blank"], { stdio: "ignore" });
let t; for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await wait(250); } }
const ws = new WebSocket(t.find((x) => x.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id === 1) { console.log(flags.join(" ") || "(none)", "=>", m.result.result.value); ws.close(); proc.kill(); } });
ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: "(() => { const g = document.createElement('canvas').getContext('webgl'); return g ? 'webgl ok: ' + g.getParameter(g.RENDERER) : 'no webgl'; })()", returnByValue: true } }));
