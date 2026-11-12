# My First AI Agent: Calculator

A minimal TypeScript agent built with the [OpenAI Agents SDK](https://openai.github.io/openai-agents-js/).
You ask it a math question in plain English. The model decides when to call a
`calculate` tool, and then explains the answer.

## Project layout

| File | What it does |
| --- | --- |
| `src/calculator.ts` | Plain arithmetic function (`+ - * /`), no `eval` |
| `src/agent.ts` | The `calculate` tool definition and the `Agent` |
| `src/cli.ts` | Command-line interface. Calls `run()`, which drives the agent loop |
| `test/calculator.test.ts` | Offline tests. They need no API key and make no API calls |

## Setup

Requires Node.js 22 or later.

```bash
npm install
```

Set your API key as an environment variable. Never commit it.

```bash
export OPENAI_API_KEY="sk-..."
```

`.env` files are git-ignored. `.env.example` shows the variable name. If you use a
`.env` file, load it with `node --env-file=.env` or your shell. This project
doesn't read `.env` on its own.

To choose a model, set `OPENAI_DEFAULT_MODEL` (for example `gpt-5-mini`). If you
don't set it, the SDK uses its default model.

## Run

Interactive mode:

```bash
npm start
```

One question:

```bash
npm start -- "If I buy 3 books at $12.50 and pay with $50, how much change do I get?"
```

The CLI prints each tool call and its result, then the agent's final answer.

## Test (no API key needed)

```bash
npm test         # unit tests for the calculator and the tool
npm run typecheck
```

## How it works

1. `run(agent, question)` sends your question and the tool schema to the model.
2. The model either answers directly or asks to call `calculate` with `{a, b, operation}`.
3. The SDK validates those arguments with Zod, runs `execute`, and sends the result back to the model.
4. Steps 2 and 3 repeat until the model returns a final text answer. `maxTurns` limits how many times this can happen.
