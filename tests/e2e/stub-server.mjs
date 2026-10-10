// Local stub server: serves the HTML fixtures and fakes the DeepL translate API,
// so end-to-end tests never leave the machine.
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const fixturesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "fixtures");

export async function startStubServer() {
  const stats = { translateCalls: 0, texts: 0 };
  const sockets = new Set();

  const server = http.createServer(async (req, res) => {
    // The extension service worker calls this endpoint cross-origin.
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    const url = new URL(req.url, "http://localhost");

    if (req.method === "OPTIONS") {
      res.writeHead(204).end();
      return;
    }

    if (req.method === "POST" && url.pathname === "/v2/translate") {
      let body = "";
      for await (const chunk of req) body += chunk;
      const texts = new URLSearchParams(body).getAll("text");
      stats.translateCalls += 1;
      stats.texts += texts.length;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          translations: texts.map((text) => ({ detected_source_language: "EN", text: `TR:${text}` })),
        }),
      );
      return;
    }

    if (url.pathname === "/stats") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(stats));
      return;
    }

    const name = path.basename(url.pathname === "/" ? "article-clean.html" : url.pathname);
    try {
      const file = await readFile(path.join(fixturesDir, name));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(file);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("not found");
    }
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  // Keep-alive sockets from Chromium would make server.close() wait forever.
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  const { port } = server.address();
  return {
    port,
    baseUrl: `http://127.0.0.1:${port}`,
    translateUrl: `http://127.0.0.1:${port}/v2/translate`,
    stats,
    close: () =>
      new Promise((resolve) => {
        for (const socket of sockets) socket.destroy();
        server.close(resolve);
      }),
  };
}
