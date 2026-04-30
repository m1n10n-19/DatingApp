# Complement — Relationship Intelligence Platform

A four-module personality architecture engine that analyzes two people through layered psychological questions and reveals their compatibility — not based on what they want, but who they actually are.

## Modules

| Module | What it does |
|---|---|
| **Discover** | Save and manage profiles in a local-only library (same browser). Pair any two profiles to analyze. |
| **Understand** | Truth Preamble → 3 required Core questions → optional depth modules (Kokology, Shadow, Desire, Contradiction pairs). Produces individual ProfileOutput + Compatibility report. |
| **Repair** | Lazy-fetched 8-field relationship repair guidance grounded in Gottman, CBT, IFS, and NVC. |
| **Simulate** | Lazy-fetched year 1/3/5/7/10 relationship projection with best- and worst-case year-10 scenarios. |

## Verdicts

| Verdict | Meaning |
|---|---|
| **COMPLEMENT** | Different architectures that complete each other. Highest long-term potential. |
| **COMBUSTION** | Intense attraction but fundamental incompatibility. Burns bright, burns out. |
| **MIRROR** | Similar architectures. Deep recognition, risk of stagnation. |
| **MISFIRE** | Fundamental misalignment. Not bad people — wrong fit. |

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS v4 + Framer Motion
- **Backend**: Express.js + OpenAI-compatible API (multi-provider)

## Quick Start

```bash
npm install
cp .env.example .env     # add API keys (Groq works out of the box)
npm run server            # Express on :3001
npm run dev               # Vite on :5173
```

Other commands:

```bash
npm test                  # Vitest test suite
npm run build             # production build
```

## Multi-Provider Support

Four LLM providers are supported via OpenAI-compatible clients:

| Provider | Env var | Default model | JSON format |
|---|---|---|---|
| **Groq** (default) | `GROQ_API_KEY` | Llama 3.3 70B | No |
| OpenAI | `OPENAI_API_KEY` | GPT-4o | Yes |
| Google Gemini | `GEMINI_API_KEY` | Gemini 2.0 Flash | Yes |
| Anthropic Claude | `ANTHROPIC_API_KEY` | Claude Sonnet 4 | No |

Groq ships with a built-in free-tier key so the app works without any configuration. Set keys via environment variables or at runtime through `POST /api/keys`.

## API Endpoints

### `POST /api/analyze`

Generates individual profiles and a compatibility report.

**Request body:**
```json
{
  "personA": { "name": "...", "gender": "...", "enabledModules": ["kokology","shadow","desire"], "moduleAnswers": { "core": ["...","...","..."], "kokology": ["...","...","...","..."], "shadow": ["...","...","..."], "desire": ["...","..."] } },
  "personB": { "...same shape..." },
  "relationshipStatus": "new_match",
  "provider": "groq",
  "model": "llama-3.3-70b-versatile"
}
```

- `relationshipStatus` — `"new_match"` (default) or `"existing_couple"`. Shapes the analysis tone.
- `provider` and `model` are optional (defaults to Groq / first model).

**Response:** `{ personA: ProfileOutput, personB: ProfileOutput, compatibility: Compatibility, meta: { provider, model } }`

### `POST /api/repair`

Generates relationship repair guidance. Rate-limited.

**Request body:** same as `/api/analyze` plus `compatibility` (the full Compatibility object from a prior analyze call).

**Response:** `{ repair: Repair }`

### `POST /api/simulate`

Generates a multi-year relationship projection. Rate-limited.

**Request body:** same as `/api/repair`.

**Response:** `{ simulation: Simulation }`

### `GET /api/models`

Returns available providers and models with availability status.

**Response:** `[{ id, name, available: boolean, models: [{ id, name }] }]`

### `POST /api/keys`

Set an API key at runtime (in-memory only, not persisted to disk).

**Request body:** `{ "key": "OPENAI_API_KEY", "value": "sk-..." }`

**Response:** `{ ok: true }`

## Schemas

### ProfileOutput (7 fields)

`archetype` · `coreWiring` · `shadowPattern` · `loveTemplate` · `complementProfile` · `likelyMistake` · `growthEdge`

### Compatibility (10 fields)

`verdict` (enum) · `score` (0-100) · `dynamic` · `magnetism` · `friction` · `shadowCollision` · `breakingPoint` · `repairLever` · `earlyWarnings` (3 strings) · `closingLine`

### Repair (8 fields)

`realBreak` · `emotionalCalibration` (`{ personA, personB }`) · `dailyPractice` · `cognitiveRepair` · `revisionPractice` · `equanimityPractice` · `shadowWork` · `communicationRepair`

### Simulation (6 fields)

`year1` · `year3` · `year5` · `year7` · `year10` (`{ bestCase, worstCase }`) · `oneIntervention`

## Profile Storage

Profiles are stored in `localStorage` under the key `complement.profiles.v1`. **Local only, same browser only** — no backend persistence, no cross-device sync, no export/import. Clearing browser data deletes all saved profiles.

## Configuration

See `.env.example` for all supported environment variables. The only required setup is at least one provider API key (Groq works without one thanks to the built-in default key).
