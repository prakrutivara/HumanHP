import { ProxyAgent, fetch as undiciFetch } from "undici";

const proxyUrl =
  process.env.HTTPS_PROXY || process.env.https_proxy;

const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

export const proxyFetch: typeof fetch = (input, init) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  return undiciFetch(url, {
    method: init?.method,
    headers: init?.headers as Record<string, string> | undefined,
    body: init?.body as string | undefined,
    ...(dispatcher ? { dispatcher } : {}),
  }) as unknown as Promise<Response>;
};