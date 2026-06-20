export function toTimestamp(value: unknown): number {
  if (!value) return 0;
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }
  return new Date(String(value)).getTime();
}

export function compareTimestampsDesc(a: unknown, b: unknown): number {
  return toTimestamp(b) - toTimestamp(a);
}

export function compareTimestampsAsc(a: unknown, b: unknown): number {
  return toTimestamp(a) - toTimestamp(b);
}
