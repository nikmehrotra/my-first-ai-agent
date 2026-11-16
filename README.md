# My First AI Agent: Calculator

A minimal TypeScript agent built with the [OpenAI Agents SDK](https://openai.github.io/openai-agents-js/).
You ask it a math question in plain English. The model decides which of its two
tools to call, `calculate` for ordinary arithmetic or `percentage` for
percentages, and then explains the answer.

## Project layout

| File | What it does |
| --- | --- |
| `src/calculator.ts` | Plain arithmetic function (`+ - * /`), no `eval` |
| `src/percentage.ts` | Percentage function (`of`, `increase`, `decrease`, `change`), no `eval` |
| `src/agent.ts` | The `calculate` and `percentage` tool definitions and the `Agent` |
| `src/cli.ts` | Command-line interface. Calls `run()`, which drives the agent loop |
| `test/calculator.test.ts` | Offline tests for `calculate` |
| `test/percentage.test.ts` | Offline tests for `percentage` |

The tests need no API key and make no API calls.

## Tools

### `calculate`

One basic arithmetic operation on two numbers: `add`, `subtract`, `multiply` or
`divide`. Dividing by zero returns an error to the model instead of crashing.

### `percentage`

One percentage calculation on two numbers. What `a` and `b` mean depends on the
operation:

| Operation | Meaning | Example | Result |
| --- | --- | --- | --- |
| `of` | `a`% of `b` | 15% of 240 → `a=15, b=240` | `36` |
| `increase` | `b` increased by `a`% | 200 plus 10% → `a=10, b=200` | `220` |
| `decrease` | `b` decreased by `a`% | 80 minus 25% → `a=25, b=80` | `60` |
| `change` | percent change from `a` (old) to `b` (new) | 50 to 75 → `a=50, b=75` | `50` (%) |

- Percentages are plain numbers: 15 means 15%, not 0.15.
- For `change`, a negative result means the value went down. The function
  divides by `|a|`, so the sign stays correct when the original value is negative.
- Percent change from an original value of 0 is undefined, so it returns an
  error to the model instead of dividing by zero.

The agent's instructions tell it to use `percentage` for percentage questions
and `calculate` for ordinary arithmetic. Multi-step questions can use both, for
example "What is 15% of 240, then multiply that by 3?" calls `percentage` and
then `calculate`.

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
npm start -- "What is 15% of 240, and then increase that result by 20%?"
```

The CLI prints each tool call and its result, the agent's final answer, and the
token usage for the run (model requests plus input, output and total tokens).

If you're behind an HTTPS proxy and get `Connection error`, set
`NODE_USE_ENV_PROXY=1` (Node 22.21 or later). Node's built-in `fetch`
ignores `HTTPS_PROXY` without it.

## Test (no API key needed)

```bash
npm test         # unit tests for both calculation functions and both tools
npm run typecheck
```

## How it works

1. `run(agent, question)` sends your question and both tool schemas to the model.
2. The model either answers directly or asks to call `calculate` or `percentage` with `{a, b, operation}`.
3. The SDK validates those arguments with Zod, runs the tool's `execute`, and sends the result back to the model.
4. Steps 2 and 3 repeat until the model returns a final text answer. `maxTurns` limits how many times this can happen.

Each pass through the loop is one model request, so a question that needs two
tool calls uses three requests: one per tool call plus one for the final answer.
