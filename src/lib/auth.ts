export type Role = 'owner' | 'store' | 'officer';

export interface Session {
  role: Role;
  id: string; // canonical login id, e.g. "Yash", "ST247", "Officer"
  displayName: string;
  storeNumber?: number;
}

/** Shared demo password for every portal. It is shown on the login page on purpose. */
export const SHARED_PASSWORD = '1845';
export const MAX_STORE_NUMBER = 500;

export const OWNER_ID = 'Yash';
export const OFFICER_ID = 'Officer';
export const EXAMPLE_STORE_IDS = ['ST247', 'ST108', 'ST71', 'ST12'];

export const formatStoreId = (n: number) => `ST${n}`;

export function parseStoreId(raw: string): number | null {
  const m = raw.trim().match(/^(?:st|store)?[\s_-]*0*(\d{1,3})$/i);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= MAX_STORE_NUMBER ? n : null;
}

export function authenticate(role: Role, id: string, password: string): Session | null {
  if (password.trim() !== SHARED_PASSWORD) return null;
  const clean = id.trim();
  if (role === 'owner' && clean.toLowerCase() === OWNER_ID.toLowerCase()) {
    return { role, id: OWNER_ID, displayName: 'Yash' };
  }
  if (role === 'officer' && clean.toLowerCase() === OFFICER_ID.toLowerCase()) {
    return { role, id: OFFICER_ID, displayName: 'Compliance Officer' };
  }
  if (role === 'store') {
    const n = parseStoreId(clean);
    if (n) return { role, id: formatStoreId(n), displayName: `Store ${formatStoreId(n)}`, storeNumber: n };
  }
  return null;
}

const KEY = 'fg_session_v1';

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return s && s.role && s.id ? s : null;
  } catch {
    return null;
  }
}

export function saveSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: session lasts until refresh */
  }
}
