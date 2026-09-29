import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const port = 9333;
const proc = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--hide-scrollbars", `--user-data-dir=${process.cwd()}/.shots/profile`, "about:blank"], { stdio: "ignore" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await wait(250); } }
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0; const pending = new Map(); const logs = [];
ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } if (m.method === "Runtime.exceptionThrown") logs.push("EXC " + JSON.stringify(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text)); if (m.method === "Runtime.consoleAPICalled" && ["error","warning"].includes(m.params.type)) logs.push(m.params.type + " " + m.params.args.map(a => a.value ?? a.description).join(" ")); });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
const shot = async (name) => { const r = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(`.shots/${name}.png`, Buffer.from(r.result.data, "base64")); };
const click = (text) => evalJs(`(() => { const el = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(text)} && b.offsetParent); if (!el) return 'missing ' + ${JSON.stringify(text)}; el.click(); return 'ok'; })()`);
await send("Runtime.enable"); await send("Page.enable");
const [mode] = process.argv.slice(2);
if (mode === "mobile") await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
else await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "http://localhost:3100/" }); await wait(4000);
const out = {};
out.overflow = await evalJs("document.documentElement.scrollWidth + ' vs ' + innerWidth");
out.webgl = await evalJs("[...document.querySelectorAll('canvas')].map(c => c.width + 'x' + c.height).join(',')");
await shot(mode + "-write");
for (const [label, name] of (mode === "mobile" ? [["Pages","pages"],["Calendar","calendar"],["Search","search"]] : [["Calendar","calendar"],["Search","search"]])) { out[name] = await click(label); await wait(1200); await shot(`${mode}-${name}`); }
if (mode !== "mobile") {
  await evalJs(`(() => { const i = document.querySelector('input'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; set.call(i,'rain'); i.dispatchEvent(new Event('input',{bubbles:true})); })()`); await wait(600); await shot("desk-search-rain");
  out.read = await click("Mum called"); await wait(800); await shot("desk-read");
  out.del = await evalJs(`document.querySelector('[aria-label="Delete entry"]').click()`); await wait(400); await shot("desk-dialog");
  out.keep = await click("Keep it");
  out.edit = await click("Edit"); await wait(600); await shot("desk-edit");
}
out.logs = logs;
console.log(JSON.stringify(out, null, 1));
ws.close(); proc.kill();
