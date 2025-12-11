/**
 * Utility helper to satisfy exhaustive checks in switch statements.
 * Throws runtime error when an unexpected value is encountered.
 */
export function assertUnreachable(
  value: never,
  message = 'Unhandled discriminated union value'
): never {
  throw new Error(`${message}: ${String(value)}`);
}
