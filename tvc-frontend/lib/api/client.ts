import { createClient } from "@/lib/supabase/client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

interface APIError {
  error: {
    code: string;
    message: string;
    request_id?: string;
    details?: { field: string; message: string }[];
  };
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: { field: string; message: string }[];

  constructor(status: number, data: APIError) {
    super(data.error.message);
    this.name = "ApiError";
    this.code = data.error.code;
    this.status = status;
    this.details = data.error.details;
  }
}

async function getAuthToken(): Promise<string | null> {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const token = await getAuthToken();
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errorData: APIError;
    try {
      errorData = await res.json();
    } catch {
      errorData = {
        error: {
          code: "UNKNOWN",
          message: `Request failed with status ${res.status}`,
        },
      };
    }
    throw new ApiError(res.status, errorData);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}
