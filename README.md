<div align="center">

# Spark.Studio — Powered by IBM Bob

**AI-powered Cognitive Repository Dashboard**

*Built for the IBM Bob Hackathon*

</div>

## What It Does

Spark.Studio is a strategic AI development partner that bridges raw code and engineering insights. IBM Bob (via Gemini 2.0 Flash) is at the core: he indexes your repository, explains complex logic, identifies performance bottlenecks, and maps architectural dependencies.

### Core Systems

**Bob's Logic Explainer**: Ask Bob any question about your codebase. He responds with technical explanations, 3 actionable suggestions, an impact rating, and a category tag. Powered by `gemini-2.0-flash` with a full repository context prompt.

**Strategic ROI Engine**: Visualizes estimated savings ($14.2k), risk mitigation (86%), and reclaimed developer hours (+48h/sprint). Includes a one-click JSON report export for stakeholders.

**Automation Lab**: Launch workflows for docs generation, security patching, prop refactoring, and CI/CD config. Each workflow has live animated progress tracking.

**Live Pulse**: Real-time sidebar that surfaces architectural drift and optimization gaps every 12 seconds. Recommendations can be auto-fixed via Bob with one click.

**Repository Intelligence**: Pie chart of code composition, bar chart of module complexity, architectural discovery panel, and a file explorer that sends files directly to Bob for deep analysis.

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the env file and add your Gemini API key:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and set GEMINI_API_KEY
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## How IBM Bob Is Used

Bob is not a wrapper around a generic chatbot. Every interaction is framed with a system prompt that positions Bob as a staff engineer who has read every file in the repository. The `bobService.ts` module:

- Sends structured prompts to `gemini-2.0-flash` with full repo context
- Requests JSON-only responses (explanation, suggestions, impact, category)
- Falls back to contextual engineering responses if the API is unavailable
- Powers both the Logic Explainer (interactive Q&A) and the Analyze Repo button (health check scan)

## Tech Stack

- React 19 + TypeScript
- Vite + Tailwind CSS v4
- Framer Motion (motion/react)
- Recharts
- Google Gemini 2.0 Flash via @google/genai
- Express.js (dev server + API routes)

## Fixes Applied (vs. original Gemini Studio output)

1. Corrected model name from `gemini-3-flash-preview` (invalid) to `gemini-2.0-flash`
2. Fixed `selectFile` async bug: query now passed directly instead of relying on React state timing
3. Fixed undefined `RECOMMENDATIONS` variable in report export
4. Added `URL.revokeObjectURL` cleanup after report download
5. Added second Bob function: `analyzeBobRepo` for repo-level health analysis
6. Workflow progress intervals now properly cleaned up on unmount
7. Added `Enter` key support on the query input
8. Quick-prompt buttons now trigger Bob immediately without a separate click
9. Added complexity bar chart with color-coded risk levels
10. Added health check API endpoint on the server
