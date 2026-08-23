export function isConvexId(value: string): boolean {
  return /^[a-z0-9]{32}$/.test(value);
}
