// These tests never call the OpenAI API, so no API key is needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculate } from '../src/calculator.js';
import { calculateTool, calculatorAgent } from '../src/agent.js';

test('calculate: basic operations', () => {
  assert.equal(calculate(2, 3, 'add'), 5);
  assert.equal(calculate(10, 4, 'subtract'), 6);
  assert.equal(calculate(6, 7, 'multiply'), 42);
  assert.equal(calculate(9, 2, 'divide'), 4.5);
  assert.equal(calculate(-1.5, 0.5, 'add'), -1);
});

test('calculate: rejects divide by zero and non-finite input', () => {
  assert.throws(() => calculate(1, 0, 'divide'), /divide by zero/);
  assert.throws(() => calculate(NaN, 1, 'add'), /finite/);
  assert.throws(() => calculate(Infinity, 1, 'add'), /finite/);
});

test('calculate: rejects unknown operations', () => {
  assert.throws(() => calculate(1, 2, 'pow' as never), /Unknown operation/);
});

test('tool is registered on the agent with the expected schema', () => {
  assert.equal(calculateTool.name, 'calculate');
  assert.ok(calculatorAgent.tools.includes(calculateTool));
  const props = calculateTool.parameters.properties as Record<string, unknown>;
  assert.deepEqual(Object.keys(props).sort(), ['a', 'b', 'operation']);
});

test('tool execute works locally (no model involved)', async () => {
  // invoke() is what the SDK calls when the model requests this tool.
  // It takes the raw JSON arguments string the model would send.
  const out = await calculateTool.invoke(
    {} as never,
    JSON.stringify({ a: 12, b: 7, operation: 'multiply' }),
  );
  assert.equal(out, "Nik's calculator agent says: 12 multiply 7 = 84");

  const err = await calculateTool.invoke(
    {} as never,
    JSON.stringify({ a: 1, b: 0, operation: 'divide' }),
  );
  assert.match(String(err), /Cannot divide by zero/);
});
