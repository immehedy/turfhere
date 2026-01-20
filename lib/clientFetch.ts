export async function clientFetch<T>(
    url: string,
    options?: RequestInit
  ): Promise<{ ok: true; data: T } | { ok: false; error: any; status: number }> {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
    });
  
    let json: any = null;
    try {
      json = await res.json();
    } catch {
      // ignore
    }
  
    if (!res.ok) return { ok: false, error: json?.error ?? "Request failed", status: res.status };
    return { ok: true, data: json as T };
  }
  