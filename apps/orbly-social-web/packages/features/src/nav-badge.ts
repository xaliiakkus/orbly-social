/** Nav / sekme rozeti metni */
export function formatNavBadgeCount(count: number): string | undefined {
  if (count <= 0) return undefined;
  return count > 99 ? "99+" : String(count);
}
