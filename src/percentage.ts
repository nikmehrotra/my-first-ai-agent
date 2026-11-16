// Pure percentage logic. Like calculator.ts: no AI, no eval, just a fixed set
// of operations.
//
// What `a` and `b` mean depends on the operation:
//   of       -> a% of b                       e.g. (15, 240) -> 36
//   increase -> b increased by a%             e.g. (10, 200) -> 220
//   decrease -> b decreased by a%             e.g. (25, 80)  -> 60
//   change   -> % change from a (old) to b (new)  e.g. (50, 75) -> 50

export type PercentageOperation = 'of' | 'increase' | 'decrease' | 'change';

export function percentage(a: number, b: number, operation: PercentageOperation): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error('Both inputs must be finite numbers.');
  }

  // Multiply before dividing by 100 to limit floating-point noise
  // (15 * 240 / 100 gives exactly 36).
  switch (operation) {
    case 'of':
      return (a * b) / 100;
    case 'increase':
      return b + (a * b) / 100;
    case 'decrease':
      return b - (a * b) / 100;
    case 'change':
      if (a === 0) {
        throw new Error('Cannot compute percentage change from an original value of 0.');
      }
      // Divide by |a| so the sign always means up (+) or down (-),
      // even when the original value is negative.
      return ((b - a) / Math.abs(a)) * 100;
    default:
      throw new Error(`Unknown percentage operation: ${String(operation)}`);
  }
}
