import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { anthropicMessage, budgetTurn } from "./budget-agent.mjs";

// Only the public example and the two brand assets are served on loopback.
const pages = new Map([
  ["/budget", ["../examples/budget/index.html", "text/html"]],
  ["/budget/", ["../examples/budget/index.html", "text/html"]],
  ...["style.css", "page.js", "budget.mjs", "language.mjs", "voice.js", "icons.js"].map(file => ["/budget/" + file, ["../public/budget/" + file, file.endsWith(".css") ? "text/css" : "text/javascript"]]),
  ["/brand/scale-bae.svg", ["../public/brand/scale-bae.svg", "image/svg+xml"]],
  ["/unicorns/dedicated.png", ["../public/unicorns/dedicated.png", "image/png"]]
]);
export function startPreview(sendMessage = anthropicMessage, port = Number(process.env.BUDGET_PREVIEW_PORT || 3491)) {
  const server = createServer(async (request, response) => {
    const path = new URL(request.url, "http://localhost").pathname;
    if (path === "/budget/turn" && request.method === "POST") {
      const host = request.headers.host;
      if (![ "127.0.0.1:" + port, "localhost:" + port ].includes(host) ||
          request.headers.origin !== "http://" + host || request.headers["content-type"] !== "application/json") {
        response.writeHead(403).end(); return;
      }
      const controller = new AbortController();
      response.on("close", () => controller.abort());
      const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(45000)]);
      try {
        const chunks = []; let bytes = 0;
        for await (const chunk of request) {
          bytes += chunk.length;
          if (bytes > 196608) { response.writeHead(413).end(); return; }
          chunks.push(chunk);
        }
        let input;
        try { input = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
        catch { response.writeHead(400).end(); return; }
        const result = await budgetTurn(input, sendMessage, signal);
        response.writeHead(200, {"content-type":"application/json", "cache-control":"no-store"}).end(JSON.stringify(result));
      } catch (err) {
        response.writeHead(err.message === "Invalid turn" ? 400 : 502).end();
      }
      return;
    }
    const asset = pages.get(path);
    if (!asset || !["GET","HEAD"].includes(request.method)) { response.writeHead(404).end(); return; }
    try {
      const bytes = await readFile(new URL(asset[0], import.meta.url));
      response.writeHead(200, {"content-type":asset[1], "cache-control":"no-store", "x-content-type-options":"nosniff"});
      response.end(request.method === "HEAD" ? undefined : bytes);
    } catch { response.writeHead(500).end(); }
  });
  return server.listen(port,"127.0.0.1",() => console.log("Budget preview at http://127.0.0.1:" + port + "/budget"));
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) startPreview();
