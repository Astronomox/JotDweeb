// Headless check for the fireball and localStorage sync. Run: node .shots/verify-store.mjs
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
const BASE = "http://localhost:3200/";
const port = 9356;
const proc = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", `--remote-debugging-port=${port}`, "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--hide-scrollbars", `--user-data-dir=${process.cwd()}/.shots/profile3`, "about:blank"], { stdio: "ignore" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 60; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await wait(250); } }
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0; const pending = new Map(); const logs = []; let blockApi = false;
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") logs.push("EXC " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  if (m.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(m.params.type)) logs.push(m.params.type + " " + m.params.args.map((a) => a.value ?? a.description).join(" "));
  if (m.method === "Fetch.requestPaused") {
    if (blockApi) send("Fetch.failRequest", { requestId: m.params.requestId, errorReason: "ConnectionRefused" });
    else send("Fetch.continueRequest", { requestId: m.params.requestId });
  }
});
const ev = async (x) => (await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true })).result?.result?.value;
const shot = async (n, clip) => { const r = await send("Page.captureScreenshot", { format: "png", ...(clip ? { clip: { ...clip, scale: 1 } } : {}) }); writeFileSync(`.shots/${n}.png`, Buffer.from(r.result.data, "base64")); };
const click = (text, scope = "") => ev(`(() => { const el = [...document.querySelectorAll('${scope} button')].find(b => b.textContent.trim().startsWith(${JSON.stringify(text)}) && b.offsetParent); if (!el) return 'MISSING ' + ${JSON.stringify(text)}; el.click(); return 'ok'; })()`);
const typeInto = (sel, val) => ev(`(() => { const i = document.querySelector(${JSON.stringify(sel)}); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(i, ${JSON.stringify(val)}); i.dispatchEvent(new Event('input',{bubbles:true})); return 'ok'; })()`);
const api = async () => (await fetch(BASE + "api/entries")).json();
await send("Runtime.enable"); await send("Page.enable");
await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/entries*" }] });
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
const out = {};

await send("Page.navigate", { url: BASE }); await wait(800);
await ev("localStorage.clear()");
await send("Page.navigate", { url: BASE }); await wait(7000);

// Fireball: backing store size and context health.
out.canvases = await ev(`[...document.querySelectorAll('canvas')].map(c => c.width + 'x' + c.height + '@' + c.style.width).join(', ')`);
await shot("fireball-sidebar", { x: 16, y: 120, width: 280, height: 90 });
for (let i = 0; i < 25; i++) { await click(i % 2 ? "Write" : "Calendar", "aside nav"); await wait(120); }
await wait(500);
out.canvasesAfter25Switches = await ev(`document.querySelectorAll('canvas').length`);
out.sidebarContextLost = await ev(`document.querySelector('aside canvas').getContext('webgl').isContextLost()`);
await click("Calendar", "aside nav"); await wait(800);
await shot("fireball-calendar", { x: 320, y: 0, width: 1120, height: 160 });

// localStorage mirror.
const server = await api();
out.lsCount = await ev(`JSON.parse(localStorage.getItem('clayjournal.entries') || '[]').length`);
out.apiCount = server.length;

// Offline save.
blockApi = true;
await click("Write", "aside nav"); await wait(300);
await typeInto("textarea", "OFFLINE TEST ENTRY\n\nWritten while the API was down."); await wait(200);
await click("Save page"); await wait(1200);
out.offlineReadH1 = await ev(`document.querySelector('main h1')?.textContent`);
out.offlineStored = await ev(`JSON.parse(localStorage.getItem('clayjournal.entries')).filter(e => e.pending).map(e => e.id.slice(0, 6) + ':' + e.title)`);
out.offlineInApi = (await api()).some((e) => e.title === "OFFLINE TEST ENTRY");
// Reload offline: pages still come from this device.
await send("Page.navigate", { url: BASE }); await wait(4000);
out.offlineReloadRecent = await ev(`[...document.querySelectorAll('aside button')].some(b => b.textContent.startsWith('OFFLINE TEST ENTRY'))`);
await click("Write", "aside nav"); await wait(300);
out.offlineHint = await ev(`[...document.querySelectorAll('main span')].some(s => s.textContent.startsWith('Offline'))`);

// Back online: reload syncs.
blockApi = false;
await send("Page.navigate", { url: BASE }); await wait(5000);
const after = await api();
const synced = after.find((e) => e.title === "OFFLINE TEST ENTRY");
out.syncedToApi = Boolean(synced);
out.pendingLeft = await ev(`JSON.parse(localStorage.getItem('clayjournal.entries')).filter(e => e.pending).length`);
if (synced) {
  await fetch(BASE + "api/entries/" + synced.id, { method: "DELETE" });
  out.cleanedUp = !(await api()).some((e) => e.title === "OFFLINE TEST ENTRY");
}

out.logs = logs;
console.log(JSON.stringify(out, null, 1));
ws.close(); proc.kill(); process.exit(0);
