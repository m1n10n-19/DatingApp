# Complement — Know Who Completes You

A personality architecture engine that analyzes two people through deep psychological questions and reveals their compatibility — not based on what they want, but who they actually are.

## How It Works

1. **Three Questions** — Each person answers three carefully designed questions that reveal personality architecture at the deepest level
2. **AI Analysis** — A personality architect AI reads between the lines, analyzing stated answers, performed answers, and revealed patterns
3. **Individual Profiles** — Each person receives an archetype, core wiring analysis, shadow pattern, complement profile, and likely mistake pattern
4. **Compatibility Report** — A detailed compatibility analysis including verdict (Complement/Combustion/Mirror/Misfire), score, relationship dynamic, breaking point, best/worst case scenarios, and early warning signs

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS v4 + Framer Motion
- **Backend**: Express.js + OpenAI API (GPT-4o)

## Setup

### Prerequisites
- Node.js 18+
- An OpenAI API key

### Installation

```bash
npm install
```

### Configuration

Copy the example environment file and add your OpenAI API key:

```bash
cp .env.example .env
```

Edit `.env` and set your key:
```
OPENAI_API_KEY=sk-...
```

### Running

Start the backend server:
```bash
npm run server
```

In a separate terminal, start the frontend:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Verdicts

| Verdict | Meaning |
|---------|---------|
| **Complement** | Different architectures that complete each other. Highest long-term potential. |
| **Combustion** | Intense attraction but fundamental incompatibility. Burns bright, burns out. |
| **Mirror** | Similar architectures. Deep recognition, risk of stagnation. |
| **Misfire** | Fundamental misalignment. Not bad people — wrong fit. |
