// Offline tests: no API key needed, no model calls.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { percentage } from '../src/percentage.js';
import { calculatorAgent, percentageTool } from '../src/agent.js';

test('percentage: of', () => {
  assert.equal(percentage(15, 240, 'of'), 36);
  assert.equal(percentage(50, 10, 'of'), 5);
  assert.equal(percentage(0, 99, 'of'), 0);
  assert.equal(percentage(150, 20, 'of'), 30);
});

test('percentage: increase', () => {
  assert.equal(percentage(10, 200, 'increase'), 220);
  assert.equal(percentage(100, 7, 'increase'), 14);
  assert.equal(percentage(0, 50, 'increase'), 50);
});

test('percentage: decrease', () => {
  assert.equal(percentage(25, 80, 'decrease'), 60);
  assert.equal(percentage(100, 80, 'decrease'), 0);
  assert.equal(percentage(0, 50, 'decrease'), 50);
});

test('percentage: change', () => {
  assert.equal(percentage(50, 75, 'change'), 50);
  assert.equal(percentage(80, 60, 'change'), -25);
  assert.equal(percentage(40, 40, 'change'), 0);
  // Negative original value: going from -50 to -25 is still an increase.
  assert.equal(percentage(-50, -25, 'change'), 50);
});

test('percentage: change from 0 throws instead of dividing by zero', () => {
  assert.throws(() => percentage(0, 10, 'change'), /original value of 0/);
});

test('percentage: rejects non-finite input and unknown operations', () => {
  assert.throws(() => percentage(NaN, 1, 'of'), /finite/);
  assert.throws(() => percentage(1, Infinity, 'increase'), /finite/);
  assert.throws(() => percentage(1, 2, 'double' as never), /Unknown percentage operation/);
});

test('percentage tool is registered with the expected schema', () => {
  assert.equal(percentageTool.name, 'percentage');
  assert.ok(calculatorAgent.tools.includes(percentageTool));
  assert.equal(calculatorAgent.tools.length, 2);
  const props = percentageTool.parameters.properties as Record<string, { enum?: string[] }>;
  assert.deepEqual(Object.keys(props).sort(), ['a', 'b', 'operation']);
  assert.deepEqual(props.operation.enum, ['of', 'increase', 'decrease', 'change']);
});

test('percentage tool execute works locally (no model involved)', async () => {
  const run = (args: object) => percentageTool.invoke({} as never, JSON.stringify(args));

  assert.equal(await run({ a: 15, b: 240, operation: 'of' }), "Nik's calculator agent says: 15% of 240 = 36");
  assert.equal(
    await run({ a: 10, b: 200, operation: 'increase' }),
    "Nik's calculator agent says: 200 increased by 10% = 220",
  );
  assert.equal(
    await run({ a: 25, b: 80, operation: 'decrease' }),
    "Nik's calculator agent says: 80 decreased by 25% = 60",
  );
  assert.equal(
    await run({ a: 50, b: 75, operation: 'change' }),
    "Nik's calculator agent says: change from 50 to 75 = 50%",
  );

  // Errors are returned to the model as text, not thrown.
  assert.match(String(await run({ a: 0, b: 10, operation: 'change' })), /^Error: .*original value of 0/);
});
