// Online status = number of open socket connections (a user can have several tabs).
const counts = new Map<number, number>();

export const isOnline = (id: number) => (counts.get(id) ?? 0) > 0;

// Returns true only when the user JUST came online (first connection).
export function connected(id: number): boolean {
  const n = (counts.get(id) ?? 0) + 1;
  counts.set(id, n);
  return n === 1;
}

// Returns true only when the user JUST went offline (last connection closed).
export function disconnected(id: number): boolean {
  const n = (counts.get(id) ?? 1) - 1;
  if (n <= 0) { counts.delete(id); return true; }
  counts.set(id, n);
  return false;
}
