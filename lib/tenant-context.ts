import { headers } from "next/headers";

const PLATFORM_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "turnero.com.ar",
  "www.turnero.com.ar",
]);

function normalizeHost(host: string | null): string | null {
  if (!host) {
    return null;
  }

  return host.split(":")[0]?.toLowerCase() ?? null;
}

export async function getRequestHost(): Promise<string | null> {
  const requestHeaders = await headers();
  return normalizeHost(requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"));
}

export function isPlatformHost(host: string | null): boolean {
  if (!host) {
    return true;
  }

  return PLATFORM_HOSTS.has(host) || host.endsWith(".localhost");
}
