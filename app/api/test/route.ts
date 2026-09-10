import { NextResponse } from "next/server";
import https from "https";

export async function GET() {
  return new Promise<Response>((resolve) => {
    const options = {
      hostname: "integrate.api.nvidia.com",
      path: "/v1/chat/completions",
      method: "POST",
      family: 4,
      headers: {
        Authorization: "Bearer YOUR_REAL_KEY",
        "Content-Type": "application/json",
      },
      timeout: 15000,
    };

    const body = JSON.stringify({
      model: "deepseek-ai/deepseek-v4-flash-0731",
      messages: [{ role: "user", content: "hello" }],
      max_tokens: 50,
    });

    const log: string[] = [];
    const start = Date.now();
    log.push("Starting request...");

    const req = https.request(options, (res) => {
      log.push(`Got response headers at ${Date.now() - start}ms, status: ${res.statusCode}`);
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        log.push(`Full response at ${Date.now() - start}ms: ${data.slice(0, 200)}`);
        resolve(NextResponse.json({ log }));
      });
    });

    req.on("socket", (socket) => {
      socket.on("lookup", () => log.push(`DNS resolved at ${Date.now() - start}ms`));
      socket.on("connect", () => log.push(`TCP connected at ${Date.now() - start}ms`));
      socket.on("secureConnect", () => log.push(`TLS handshake done at ${Date.now() - start}ms`));
    });

    req.on("timeout", () => {
      log.push(`TIMEOUT at ${Date.now() - start}ms`);
      resolve(NextResponse.json({ log }));
    });

    req.on("error", (err) => {
      log.push(`ERROR at ${Date.now() - start}ms: ${err.message}`);
      resolve(NextResponse.json({ log }));
    });

    req.write(body);
    req.end();
  });
}