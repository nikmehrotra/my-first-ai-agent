import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { run } from '@openai/agents';
import { calculatorAgent } from './agent.js';

async function main() {
  // The SDK reads OPENAI_API_KEY from the environment automatically.
  // We check it up front only to give a friendly message.
  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY. Set it in your environment (see README).');
    process.exit(1);
  }

  // One-shot mode: npm start -- "What is 12 * 7?"
  const question = process.argv.slice(2).join(' ').trim();
  if (question) {
    await ask(question);
    return;
  }

  // Interactive mode.
  const rl = readline.createInterface({ input, output });
  console.log('Calculator agent. Ask a math question, or type "exit" to quit.');
  try {
    while (true) {
      const line = (await rl.question('\n> ')).trim();
      if (!line) continue;
      if (line === 'exit' || line === 'quit') break;
      await ask(line);
    }
  } finally {
    rl.close();
  }
}

async function ask(question: string) {
  try {
    // ---- Execution loop ----------------------------------------------------
    // `run` drives the agent loop for us:
    //   1. send the question (+ tool definitions) to the model
    //   2. if the model asks for a tool call, run `execute` and send the result back
    //   3. repeat until the model produces a final text answer (or maxTurns is hit)
    const result = await run(calculatorAgent, question, { maxTurns: 10 });

    // Show the tool calls that happened, so you can see the loop at work.
    for (const item of result.newItems) {
      if (item.type === 'tool_call_item' && item.rawItem.type === 'function_call') {
        console.log(`  [tool call] ${item.rawItem.name}(${item.rawItem.arguments})`);
      } else if (item.type === 'tool_call_output_item') {
        console.log(`  [tool result] ${String(item.output)}`);
      }
    }

    console.log(`\n${result.finalOutput}`);

    // Token usage summed over every model request in this run (one per turn).
    const usage = result.runContext.usage;
    console.log(
      `\n[usage] requests: ${usage.requests}, input tokens: ${usage.inputTokens}, ` +
        `output tokens: ${usage.outputTokens}, total tokens: ${usage.totalTokens}`,
    );
  } catch (error) {
    console.error('Agent error:', error instanceof Error ? error.message : error);
  }
}

main();
