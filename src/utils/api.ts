import { User } from '../types';

const SESSION_KEY = 'testplatform_session_v1';

export interface StoredSession {
  user: User;
  token: string;
  savedAt: number;
}

export function saveSession(user: User, token: string) {
  const session: StoredSession = {
    user,
    token,
    savedAt: Date.now()
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: StoredSession = JSON.parse(raw);

    // 30 days check: 30 * 24 * 60 * 60 * 1000
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - session.savedAt > THIRTY_DAYS) {
      clearSession();
      return null;
    }
    return session;
  } catch (err) {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const session = getStoredSession();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (session && session.token) {
    headers.set('Authorization', `Bearer ${session.token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "So'rovni bajarishda xatolik yuz berdi");
  }

  return data;
}
