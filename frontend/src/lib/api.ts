/** Client for the Mingleo API. Next.js proxies /api to Express, so sessions are same-origin cookies. */

export class ApiError extends Error {
  constructor(public status: number, message: string, public issues?: { path: string; message: string }[]) {
    super(message)
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export async function api<T = unknown>(path: string, opts: { method?: Method; body?: unknown; raw?: Blob } = {}): Promise<T> {
  const method = opts.method ?? (opts.body !== undefined || opts.raw ? 'POST' : 'GET')
  const headers: Record<string, string> = {}
  // Custom header required by the API's CSRF guard on every state-changing request.
  if (method !== 'GET') headers['x-mingleo-csrf'] = '1'
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts.raw) headers['Content-Type'] = opts.raw.type
  const res = await fetch(`/api${path}`, {
    method,
    headers,
    credentials: 'same-origin',
    body: opts.raw ?? (opts.body === undefined ? undefined : JSON.stringify(opts.body)),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data.issues?.[0]?.message && data.code === 'validation' ? data.issues[0].message : data.error
    throw new ApiError(res.status, msg ?? `Something went wrong (${res.status})`, data.issues)
  }
  return data as T
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong')
