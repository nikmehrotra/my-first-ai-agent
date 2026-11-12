import { Agent, tool } from '@openai/agents';
import { z } from 'zod';
import { calculate } from './calculator.js';

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
    return `${a} ${operation} ${b} = ${result}`;
  },
  // If `execute` throws (e.g. divide by zero), send the message to the model
  // instead of crashing, so it can explain the problem to the user.
  errorFunction: (_context, error) =>
    `Error: ${error instanceof Error ? error.message : String(error)}`,
});

// ---- Agent -----------------------------------------------------------------
// An agent is an LLM + instructions + the tools it may use. The model decides
// on its own whether (and how many times) to call `calculate`.
export const calculatorAgent = new Agent({
  name: 'Calculator Agent',
  instructions: [
    'You are a helpful math assistant.',
    'For any arithmetic, use the calculate tool instead of doing math in your head.',
    'Multi-step problems may need several tool calls; call them one step at a time.',
    'After getting tool results, give the final answer with a short explanation.',
  ].join(' '),
  tools: [calculateTool],
});
