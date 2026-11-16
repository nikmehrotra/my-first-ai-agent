import { Agent, tool } from '@openai/agents';
import { z } from 'zod';
import { calculate } from './calculator.js';
import { percentage } from './percentage.js';

// ---- Tool definition -------------------------------------------------------
// The name, description and parameter schema are sent to the model so it knows
// the tool exists and how to call it. The SDK validates the model's arguments
// against the Zod schema before `execute` runs.
export const calculateTool = tool({
  name: 'calculate',
  description:
    'Perform one basic arithmetic operation (add, subtract, multiply, divide) on two numbers.',
  parameters: z.object({
    a: z.number().describe('The first number'),
    b: z.number().describe('The second number'),
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
  }),
  execute: async ({ a, b, operation }) => {
    const result = calculate(a, b, operation);
    // Whatever we return here is sent back to the model as the tool output.
    return `Nik's calculator agent says: ${a} ${operation} ${b} = ${result}`;
  },
  // If `execute` throws (e.g. divide by zero), send the message to the model
  // instead of crashing, so it can explain the problem to the user.
  errorFunction: (_context, error) =>
    `Error: ${error instanceof Error ? error.message : String(error)}`,
});

// ---- Percentage tool -------------------------------------------------------
// `a` and `b` mean different things per operation, so the descriptions spell
// that out: the model only sees this text when choosing its arguments.
export const percentageTool = tool({
  name: 'percentage',
  description: [
    'Perform one percentage calculation on two numbers.',
    'Operations:',
    '"of": a percent of b (15% of 240 -> a=15, b=240).',
    '"increase": b increased by a percent (200 plus 10% -> a=10, b=200).',
    '"decrease": b decreased by a percent (80 minus 25% -> a=25, b=80).',
    '"change": percent change from an original value a to a new value b',
    '(from 50 to 75 -> a=50, b=75; the result is in percent, negative means a decrease).',
    'Percent values are plain numbers: pass 15 for 15%, not 0.15.',
  ].join(' '),
  parameters: z.object({
    a: z
      .number()
      .describe(
        'For "of", "increase" and "decrease": the percentage (15 means 15%). For "change": the original (old) value.',
      ),
    b: z
      .number()
      .describe(
        'For "of", "increase" and "decrease": the base value the percentage applies to. For "change": the new value.',
      ),
    operation: z
      .enum(['of', 'increase', 'decrease', 'change'])
      .describe('Which percentage calculation to perform.'),
  }),
  execute: async ({ a, b, operation }) => {
    const result = percentage(a, b, operation);
    const summary = {
      of: `${a}% of ${b} = ${result}`,
      increase: `${b} increased by ${a}% = ${result}`,
      decrease: `${b} decreased by ${a}% = ${result}`,
      change: `change from ${a} to ${b} = ${result}%`,
    }[operation];
    return `Nik's calculator agent says: ${summary}`;
  },
  errorFunction: (_context, error) =>
    `Error: ${error instanceof Error ? error.message : String(error)}`,
});

// ---- Agent -----------------------------------------------------------------
// An agent is an LLM + instructions + the tools it may use. The model decides
// on its own whether (and how many times) to call each tool.
export const calculatorAgent = new Agent({
  name: 'Calculator Agent',
  instructions: [
    'You are a helpful math assistant.',
    'Use the percentage tool for percentage questions: a percent of a number,',
    'increasing or decreasing a number by a percent, or the percent change between two values.',
    'Use the calculate tool for ordinary arithmetic (+, -, *, /).',
    'Never do the math in your head.',
    'Multi-step problems may need several tool calls, possibly using both tools; call them one step at a time.',
    'After getting tool results, give the final answer with a short explanation.',
  ].join(' '),
  tools: [calculateTool, percentageTool],
});
