export interface BlueskyPostInfo {
  did: string;
  cid: string;
}

export function parseBlueskyUrl(
  url: string
): { handle: string; cid: string } | null {
  try {
    const urlObj = new URL(url);

    // Match pattern: https://bsky.app/profile/{handle}/post/{cid}
    const match = urlObj.pathname.match(
      /^\/profile\/([^\/]+)\/post\/([^\/]+)$/
    );

    if (!match) {
      return null;
    }

    const [, handle, cid] = match;
    return { handle, cid };
  } catch {
    return null;
  }
}

export async function resolveBlueskyHandle(
  handle: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.did;
  } catch {
    return null;
  }
}

export async function convertBlueskyUrl(
  url: string
): Promise<BlueskyPostInfo | null> {
  const parsed = parseBlueskyUrl(url);
  if (!parsed) {
    return null;
  }

  const did = await resolveBlueskyHandle(parsed.handle);
  if (!did) {
    return null;
  }

  return {
    did,
    cid: parsed.cid,
  };
}
