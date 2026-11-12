// Pure arithmetic logic. No AI here, and no eval: we switch on a fixed set of
// operators, so the model can only ever ask for one of these four operations.

export type Operation = 'add' | 'subtract' | 'multiply' | 'divide';

export function calculate(a: number, b: number, operation: Operation): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error('Both inputs must be finite numbers.');
  }

  switch (operation) {
    case 'add':
      return a + b;
    case 'subtract':
      return a - b;
    case 'multiply':
      return a * b;
    case 'divide':
      if (b === 0) throw new Error('Cannot divide by zero.');
      return a / b;
    default:
      throw new Error(`Unknown operation: ${String(operation)}`);
  }
}
