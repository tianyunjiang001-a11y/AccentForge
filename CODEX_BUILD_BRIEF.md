# AccentForge — Codex Build Brief

**Version:** 1.1
**Status:** Frozen Build Specification  
**Project:** AccentForge  
**Implementation Mode:** Sequential, test-first, mock-first  
**Primary Platforms:** Kimi + MiniMax + Cloudflare

---

# 1. Purpose of This Document

This document defines how Codex must build AccentForge.

Codex must treat the following files as authoritative project specifications:

1. `PRODUCT_SPEC.md`
2. `IELTS_AGENT_RULES.md`
3. `CODEX_BUILD_BRIEF.md`
4. `DESIGN_SYSTEM.md`

The four files serve different purposes:

- `PRODUCT_SPEC.md` defines **what the product does**.
- `IELTS_AGENT_RULES.md` defines **how the AI behaves**.
- `CODEX_BUILD_BRIEF.md` defines **how the software must be built**.
- `DESIGN_SYSTEM.md` defines **how the product must look and feel**.

Codex must not reinterpret, expand, redesign, or visually restyle the product unless explicitly instructed.

---

# 2. Core Development Rule

AccentForge must be built in strict phases.

Do not integrate all services at once.

The required development sequence is:

**Product Scaffold**

↓

**Static UI**

↓

**Mock Workflow**

↓

**Kimi Chinese Idea Structuring**

↓

**Kimi IELTS English Generation**

↓

**MiniMax Voice Generation**

↓

**Security and Cost Protection**

↓

**Cloudflare Deployment**

↓

**QA**

↓

**Documentation**

↓

**Release**

Each phase must be usable and testable before the next phase begins.

Do not skip phases merely because later functionality is technically available.

---

# 3. Do Not Add Features

Codex must not add unapproved features.

Do NOT add:

- user registration;
- login;
- user profiles;
- databases;
- saved history;
- subscriptions;
- payments;
- ads;
- question banks;
- IELTS mock tests;
- automatic IELTS scoring;
- microphone recording;
- speech recognition;
- pronunciation grading;
- pronunciation correction;
- flashcards;
- vocabulary quizzes;
- AI chat;
- downloadable audio;
- social sharing;
- analytics dashboards;
- admin dashboards;
- multilingual UI;
- complex animations;
- local installation UI;
- Docker unless specifically requested;
- mobile apps;
- browser extensions.

If a feature is not explicitly required in the four specification documents, assume it is outside V1.

Do not introduce “helpful extras” without approval.

---

# 4. Technology Stack

Use the following stack unless technically impossible.

## Frontend

Use:

- React
- Vite
- TypeScript
- CSS or a lightweight styling system

Do not use a heavy UI framework unless necessary.

The interface should remain:

- lightweight;
- responsive;
- easy to maintain;
- visually refined;
- fast to load.

All frontend design decisions must comply with `DESIGN_SYSTEM.md`.

---

## Backend

Use:

**Cloudflare Workers**

Backend responsibilities:

- Kimi text-generation requests;
- MiniMax speech-generation requests;
- input validation;
- output validation;
- API credential protection;
- rate limiting;
- abuse protection;
- cost protection;
- speech generation.

---

## Hosting

Use:

**Cloudflare Pages** for the frontend.

Use:

**Cloudflare Workers** for backend API endpoints.

---

## Text AI Provider

Use:

**Kimi / Moonshot AI**

for:

1. Chinese idea structuring;
2. IELTS English generation.

## Speech AI Provider

Use:

**MiniMax Audio**

for:

1. accent-aware text-to-speech.

Kimi is the only approved V1 text provider.

MiniMax is the only approved V1 speech provider.

Do not add provider selection UI, fallback providers or client-side provider calls.

All provider credentials must remain server-side.

Required service boundaries:

```text
AccentForge Language Service
→ TextGenerationProvider
→ KimiTextProvider
→ Kimi API

AccentForge Speech Service
→ SpeechSynthesisProvider
→ MiniMaxSpeechProvider
→ MiniMax Speech API
```

Routes and services must consume normalised AccentForge results, never raw vendor response objects. Pedagogical prompts and provider transport must remain separate.

All AI traffic must pass through the Cloudflare Worker. Never add a browser-side provider request or log an API key. Avoid logging full student content unless strictly necessary for an approved operational purpose.

---

# 5. Recommended Repository Structure

Create a repository structured approximately as follows:

```text
AccentForge/
│
├── README.md
├── PRODUCT_SPEC.md
├── IELTS_AGENT_RULES.md
├── CODEX_BUILD_BRIEF.md
├── DESIGN_SYSTEM.md
├── LICENSE
├── .gitignore
├── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── worker/
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   ├── services/
│   │   ├── providers/
│   │   ├── prompts/
│   │   ├── validation/
│   │   └── config/
│   │
│   ├── wrangler.toml
│   └── package.json
│
├── docs/
│   ├── architecture.md
│   ├── evaluation.md
│   └── limitations.md
│
├── tests/
│   ├── fixtures/
│   └── qa-cases.md
│
└── assets/
    ├── screenshots/
    ├── demo/
    └── audio/
```

Minor structural changes are acceptable if they improve maintainability.

Do not make the repository unnecessarily complex.

---

# 6. Environment and Secret Management

Never commit real API credentials.

Use:

```text
.env
```

locally.

Add `.env` to `.gitignore`.

Provide only:

```text
.env.example
```

Example:

```text
KIMI_API_KEY=
KIMI_BASE_URL=
KIMI_TEXT_MODEL=kimi-k2.6

MINIMAX_API_KEY=
MINIMAX_BASE_URL=
MINIMAX_TTS_MODEL=speech-2.8-turbo

MINIMAX_BRITISH_FEMALE_VOICE_ID=
MINIMAX_BRITISH_MALE_VOICE_ID=
MINIMAX_AMERICAN_FEMALE_VOICE_ID=
MINIMAX_AMERICAN_MALE_VOICE_ID=
MINIMAX_AUSTRALIAN_FEMALE_VOICE_ID=
MINIMAX_AUSTRALIAN_MALE_VOICE_ID=
MINIMAX_CANADIAN_FEMALE_VOICE_ID=
MINIMAX_CANADIAN_MALE_VOICE_ID=
```

`KIMI_BASE_URL` and `MINIMAX_BASE_URL` may remain empty until their implementation phases verify the current official provider documentation.

Model identifiers must be environment-driven from one configuration source rather than repeated throughout the codebase.

Before the first runtime integration, verify base URLs, authentication, model identifiers, request formats and response formats against the current official Kimi and MiniMax API documentation.

Production credentials must be stored as Cloudflare Worker secrets.

No API key may appear in:

- GitHub;
- frontend code;
- browser JavaScript;
- logs;
- README;
- screenshots;
- demo files;
- public documentation.

---

# 7. Phase 1 — Repository Scaffold

## Goal

Create the project structure before building functional AI features.

## Required Tasks

Create:

- repository structure;
- React/Vite frontend;
- Cloudflare Worker backend scaffold;
- TypeScript configuration;
- lightweight linting/formatting if useful;
- `.gitignore`;
- `.env.example`;
- all four specification files.

Create the initial single-page shell.

Do not connect Kimi or MiniMax yet.

Do not implement production AI logic yet.

---

## Acceptance Criteria

Phase 1 passes when:

- frontend starts locally;
- Worker starts locally;
- no AI API is required;
- repository structure is clean;
- no production secrets exist;
- all four specification files are present;
- frontend and backend can be developed independently.

---

## Suggested Commit

```text
chore: initialise AccentForge project structure
```

---

# 8. Phase 2 — Static UI

## Goal

Build the complete user interface before any real AI integration.

The user interface should visually support the entire final workflow.

No real AI API calls should occur during this phase.

---

## Mandatory Visual Requirement

All frontend implementation must comply with `DESIGN_SYSTEM.md`.

Visual deviation or introduction of additional colour systems, heavy gradients, dashboard patterns, unnecessary UI components, decorative AI motifs, or visual styles outside the approved design system requires explicit approval.

Codex must not independently “improve” the design by introducing:

- new colour palettes;
- purple or blue AI gradients;
- glassmorphism-heavy interfaces;
- sidebar dashboards;
- colourful educational cards;
- oversized hero sections;
- decorative illustrations;
- stock imagery;
- animated background effects;
- emoji-heavy controls;
- unnecessary navigation;
- generic SaaS styling.

The approved visual direction is:

**Apple-inspired, minimal, premium, calm, spacious and restrained.**

The interface must feel like a polished productivity tool rather than a marketing website.

---

# 9. Required Static UI Controls

## Speaking Part

Buttons:

- Part 1
- Part 2
- Part 3

Use the segmented-control visual language defined in `DESIGN_SYSTEM.md`.

---

## Target Band

Buttons:

- 5
- 6
- 7
- 8
- 9

Label:

**Target Band**

Never label this as:

- predicted score;
- estimated score;
- IELTS score.

---

## Left Editor

Label:

**What I Want to Say**

Requirements:

- editable;
- accepts Chinese;
- maximum 1000 characters;
- visible character counter;
- large, comfortable writing area;
- visually integrated into the main workspace.

Button:

**Polish My Idea**

---

## Right Editor

Label:

**IELTS Speaking Version**

Requirements:

- display generated English;
- editable if convenient;
- visually separate from Chinese;
- equal visual importance to the left panel.

Button:

**Generate English**

---

## Accent Selector

Options:

- British
- American
- Australian
- Canadian

Use a restrained segmented control.

Do not use flags unless later explicitly approved.

---

## Voice Selector

Options:

- Female
- Male

Use the same visual system as the other segmented controls.

---

## Audio

Button:

**Read Aloud**

Audio player appears only after audio has been successfully generated.

---

# 10. Static UI Design Requirements

The page must:

- use a single-page layout;
- follow `DESIGN_SYSTEM.md`;
- maintain generous whitespace;
- use the approved three-colour visual system;
- avoid visual clutter;
- avoid technical language;
- remain visually balanced;
- work well on desktop and mobile;
- present the transformation workflow clearly.

Desktop should prioritise a two-column workspace:

```text
┌─────────────────────┬─────────────────────┐
│                     │                     │
│ What I Want to Say  │ IELTS Speaking      │
│                     │ Version             │
│                     │                     │
│ Chinese             │ English             │
│                     │                     │
└─────────────────────┴─────────────────────┘
```

Mobile should stack the workflow vertically.

---

## UX Rules

The page must:

- fit within one primary workflow;
- avoid unnecessary navigation;
- avoid menus where simple buttons are enough;
- avoid explanatory paragraphs inside the working area;
- make the next action visually obvious;
- remain understandable without instructions.

---

## Acceptance Criteria

Phase 2 passes when:

- all controls are visible;
- all controls are styled according to `DESIGN_SYSTEM.md`;
- buttons are clickable;
- segmented controls clearly show selected states;
- layout works responsively;
- two-column desktop layout works;
- mobile stacking works;
- no Kimi or MiniMax requests occur;
- no additional colour system has been introduced;
- no unapproved UI component exists;
- UI accurately reflects `PRODUCT_SPEC.md`.

---

## Suggested Commit

```text
feat: build AccentForge static interface
```

---

# 11. Phase 3 — Mock Workflow

## Goal

Simulate the entire user journey without using Kimi or MiniMax.

This phase is mandatory.

Do not skip directly to real API integration.

---

## Mock Behaviour

When the user enters Chinese and clicks:

**Polish My Idea**

return a hard-coded or deterministic mock Chinese response.

Example:

Input:

```text
我喜欢大城市，工作机会多，但是压力也很大。
```

Mock polished Chinese:

```text
我比较喜欢住在大城市，主要是因为工作机会更多，而且生活通常也更方便。不过，大城市的生活节奏比较快，压力也会更明显，所以我觉得是否适合长期生活还是要看个人选择。
```

---

When clicking:

**Generate English**

return mock English:

```text
I generally prefer living in big cities, mainly because there are more job opportunities and everyday life tends to be more convenient. That said, city life can also be quite stressful, so I think whether it suits someone in the long run really depends on their priorities.
```

---

When clicking:

**Read Aloud**

use:

- a local test audio file;
- or temporary browser playback placeholder.

Do not connect real TTS yet.

---

# 12. Required Mock State Behaviour

Test:

- Part selection;
- Band selection;
- Chinese editing;
- polished Chinese replacement;
- English generation;
- accent selection;
- voice selection;
- audio playback;
- stale state behaviour.

If Part or Band changes after generation, previous generated content should be considered stale.

If polished Chinese is manually changed after English generation, the existing English version should be considered stale.

Changing Accent or Voice should not regenerate Chinese or English.

---

## Acceptance Criteria

A non-technical user must be able to complete:

**Select Part**

↓

**Select Band**

↓

**Enter Chinese**

↓

**Polish**

↓

**Review/Edit Chinese**

↓

**Generate English**

↓

**Select Accent**

↓

**Select Voice**

↓

**Play Audio**

without explanation.

No real AI request should occur.

The entire flow must comply visually with `DESIGN_SYSTEM.md`.

---

## Suggested Commit

```text
feat: implement complete mock user workflow
```

---

# 13. Phase 4 — Kimi Chinese Idea Structuring Integration

## Goal

Integrate the first real Kimi capability through the AccentForge language service and text-provider boundary.

Only:

**Raw Chinese → Structured Chinese**

must become real.

English and TTS remain mocked.

Required workflow:

```text
Raw Chinese
+ Speaking Part
+ Target Band
→ /api/polish
→ Chinese Agent
→ KimiTextProvider
→ Kimi API
→ normalised Structured Chinese
→ frontend
```

The route must receive only the normalised AccentForge result. It must not parse a raw Kimi response.

Kimi transport concerns must stay in `KimiTextProvider`:

- authentication;
- API endpoint;
- model selection;
- request transport;
- response parsing;
- provider error normalisation.

IELTS prompt logic must stay outside the provider layer.

Use `KIMI_TEXT_MODEL` as the single model configuration source. The intended initial baseline is `kimi-k2.6`; Kimi K3 is not the default. The environment-driven boundary must allow a later model comparison without restructuring application code.

Before implementing a runtime request, verify the exact model identifier, base URL, authentication, request format, structured-output capabilities and response format against the current official Kimi Open Platform documentation.

---

# 14. Chinese Agent Endpoint

Suggested endpoint:

```text
POST /api/polish
```

Request:

```json
{
  "rawChinese": "...",
  "part": 1,
  "targetBand": 7
}
```

Response:

```json
{
  "structuredChinese": "..."
}
```

---

# 15. Prompt Source

Prompt behaviour must come directly from:

`IELTS_AGENT_RULES.md`

Create modular prompt files.

Recommended:

```text
worker/src/prompts/global.ts
worker/src/prompts/parts.ts
worker/src/prompts/bands.ts
worker/src/prompts/chinese-agent.ts
```

Do not place the entire prompt as one giant unstructured string if avoidable.

Keep:

- global rules;
- Part rules;
- Band rules;
- agent-specific instructions

logically separated.

---

# 16. Agent A Behaviour Requirements

Agent A must:

- return Chinese only;
- preserve original meaning;
- respect Part logic;
- respect Target Band idea density;
- avoid invented major personal facts;
- avoid unnecessary verbosity;
- avoid explanations;
- avoid English;
- avoid scores;
- avoid teaching commentary;
- produce output suitable for user editing.

---

# 17. Server Validation

Reject:

- empty input;
- input above 1000 characters;
- unsupported Part;
- unsupported Band;
- malformed requests.

Do not trust frontend validation alone.

---

# 18. Chinese Agent QA Requirement

Test at least:

### Part 1

5 examples

### Part 2

5 examples

### Part 3

5 examples

Total minimum:

**15 Chinese structuring tests**

---

## Acceptance Criteria

Phase passes when:

- all 15 cases return coherent Chinese;
- Part 1 remains concise;
- Part 2 supports long-form development;
- Part 3 develops reasoning;
- no major fabricated facts appear;
- output remains natural Chinese;
- output is editable in the frontend;
- errors fail gracefully.

---

## Suggested Commits

```text
feat: add Kimi IELTS idea structuring prompts
```

```text
feat: integrate Kimi Chinese idea structuring API
```

```text
test: add Chinese structuring evaluation cases
```

---

# 19. Phase 5 — Kimi IELTS English Generation

## Goal

Replace the mock English response with Kimi-generated spoken English through the same AccentForge language service and text-provider boundary.

Required workflow:

```text
Latest Structured Chinese
+ Speaking Part
+ Target Band
→ /api/generate
→ English Agent
→ KimiTextProvider
→ Kimi API
→ normalised spoken English
→ frontend
```

Kimi-specific response formats must not leak to the frontend.

---

## Endpoint

Suggested:

```text
POST /api/generate
```

Request:

```json
{
  "structuredChinese": "...",
  "part": 2,
  "targetBand": 7
}
```

Response:

```json
{
  "spokenEnglish": "..."
}
```

---

# 20. Critical State Rule

The English Agent must use:

**the latest structured Chinese text**

including any manual edits made by the user.

Do not use the original raw Chinese once the user has edited the polished version.

---

# 21. English Prompt Requirements

Follow `IELTS_AGENT_RULES.md`.

The output must:

- sound spoken;
- preserve meaning;
- match selected Part;
- reflect Target Band;
- avoid essay English;
- avoid idiom stuffing;
- avoid obscure vocabulary;
- avoid fabricated life details;
- avoid score claims;
- remain realistically speakable;
- return English only.

---

# 22. Band Differentiation Testing

For at least one fixed Chinese answer per Part, generate:

- Band 5;
- Band 6;
- Band 7;
- Band 8;
- Band 9.

Minimum comparison matrix:

```text
Part 1 × Bands 5–9
Part 2 × Bands 5–9
Part 3 × Bands 5–9
```

Total:

**15 band comparison outputs**

---

## Evaluation Questions

For each sequence ask:

1. Does lexical flexibility increase naturally?
2. Does grammar become more flexible?
3. Does reasoning become more nuanced where appropriate?
4. Does the output remain speakable?
5. Does Band 9 remain natural?
6. Does Band 5 remain correct?
7. Are idioms being overused?
8. Does the answer sound memorised?
9. Is the learner's original meaning preserved?
10. Does the Part still feel correct?

---

## Acceptance Criteria

Do not proceed until Target Bands show meaningful but natural progression.

A higher Band must not merely add:

- longer words;
- more idioms;
- more sentences;
- more formal vocabulary.

Higher Target Bands should show greater:

- flexibility;
- precision;
- grammatical control;
- lexical range;
- nuance.

---

## Suggested Commits

```text
feat: add Kimi IELTS English generation engine
```

```text
test: evaluate target band differentiation
```

---

# 23. Phase 6 — MiniMax Accent-Aware Voice Engine

## Goal

Integrate MiniMax Speech 2.8 through the AccentForge speech service and speech-provider boundary.

Required workflow:

```text
Latest IELTS English
+ Accent
+ Voice
→ /api/speech
→ Speech Service
→ Voice Map
→ MiniMaxSpeechProvider
→ MiniMax Speech 2.8
→ audio
→ frontend player
```

Use `MINIMAX_TTS_MODEL` as the single model configuration source. The intended initial V1 model is `speech-2.8-turbo`. The provider boundary must allow a later switch to `speech-2.8-hd` without restructuring the speech service.

Before implementing a runtime request, verify the base URL, authentication, Speech 2.8 endpoint, exact request format, `voice_id` behaviour and audio response format against the current official MiniMax API documentation.

MiniMax-specific response formats and errors must not leak to the route or frontend.

---

## Supported Accent Values

Exactly:

```text
british
american
australian
canadian
```

---

## Supported Voice Values

Exactly:

```text
female
male
```

---

## Endpoint

Suggested:

```text
POST /api/speech
```

Request:

```json
{
  "text": "...",
  "accent": "british",
  "voice": "female"
}
```

Return:

- audio response;
- or temporary audio-compatible stream/blob.

---

# 24. Voice Prompt Behaviour

Speech should be:

- clear;
- natural;
- conversational;
- moderately paced;
- appropriate for IELTS shadowing;
- non-theatrical;
- easy to understand.

Accent should be recognisable but not exaggerated.

Do not describe accents using stereotypes.

---

# 25. Accent Profiles

## British

Contemporary standard British pronunciation.

## American

General American pronunciation.

## Australian

Contemporary General Australian pronunciation.

## Canadian

Contemporary General Canadian pronunciation.

---

# 26. Voice Presentation

Use two clearly different synthetic voice presentations:

- Female
- Male

Do not imply the system is cloning or reproducing any real person.

The eight Accent × Voice combinations are fixed logical product profiles. Map them centrally to environment-configured MiniMax voice IDs. Do not expose voice IDs in the frontend, duplicate them through the source tree or invent their values. The product owner must approve the real voice IDs before Phase 6 implementation.

Keep the same logical voice profile stable across sessions wherever possible. Do not add user-facing voice cloning or voice-design controls.

---

# 27. Voice Efficiency Rules

Never generate all eight Accent × Voice combinations automatically.

Only generate audio after:

**Read Aloud**

is explicitly clicked.

Only generate the currently selected:

**Accent × Voice**

combination.

Changing Accent or Voice must not automatically trigger TTS.

---

# 28. Voice QA Matrix

Test all eight combinations:

```text
British Female
British Male

American Female
American Male

Australian Female
Australian Male

Canadian Female
Canadian Male
```

Evaluate:

- intelligibility;
- accent consistency;
- naturalness;
- pacing;
- voice distinction;
- shadowing suitability.

---

## Suggested Commits

```text
feat: add MiniMax accent-aware speech generation
```

```text
test: verify eight voice combinations
```

---

# 29. Phase 7 — Production Protection

This phase must occur before public deployment.

---

# 30. Character Limits

Frontend:

maximum 1000 characters.

Backend:

must independently enforce the same limit.

Never rely only on frontend protection.

---

# 31. Request Control

Add reasonable server-side protection against:

- repeated automated calls;
- accidental double submission;
- rapid repeated TTS generation;
- bot traffic;
- malformed requests.

Buttons should enter appropriate disabled/loading states during active requests.

---

# 32. Bot Protection

Use:

**Cloudflare Turnstile**

or equivalent Cloudflare-native protection.

Normal users should experience minimal friction.

Do not require account creation solely for abuse protection.

---

# 33. Rate Limiting

Add reasonable rate limiting.

The purpose is:

- cost control;
- abuse prevention;
- API protection.

Do not create login accounts solely for rate limiting.

---

# 34. Spending Protection

The product owner pays for Kimi text generation and MiniMax speech generation while the public V1 remains free to users.

Configure provider usage and budget monitoring for both services. Start with conservative limits and increase them only when observed demand justifies it.

Treat TTS as the likely higher variable-cost component.

Preserve these request-level controls:

- maximum 1000-character Chinese input;
- no generation while typing;
- explicit Polish My Idea action;
- explicit Generate English action;
- explicit Read Aloud action;
- exactly one selected voice generated per TTS request;
- server-side credentials;
- rate limiting and bot protection before public launch.

The software must fail gracefully if the provider limit is reached.

---

# 35. Error Messages

Frontend errors must remain simple.

Examples:

```text
Something went wrong while polishing your idea. Please try again.
```

```text
Something went wrong while generating English. Please try again.
```

```text
Audio could not be generated. Please try again.
```

```text
Today's public usage limit has been reached. Please try again later.
```

Never show:

- Kimi or MiniMax error objects;
- provider status codes;
- model names;
- base URLs or internal URLs;
- credentials or secret values;
- raw stack traces;
- HTTP implementation details;
- backend debugging data.

Provider errors must be normalised inside the provider layer before they reach services or routes.

Error presentation must also comply with `DESIGN_SYSTEM.md`.

Do not introduce bright warning colours unless functionally necessary.

---

## Suggested Commit

```text
feat: add production security and usage controls
```

---

# 36. Phase 8 — Cloudflare Deployment

## Frontend

Deploy:

```text
frontend/
```

to:

**Cloudflare Pages**

---

## Backend

Deploy:

```text
worker/
```

to:

**Cloudflare Workers**

---

## Production Secrets and Configuration

Store:

```text
KIMI_API_KEY
MINIMAX_API_KEY
```

using Cloudflare secrets.

Never commit them or log their values.

Configure the Kimi and MiniMax base URLs, model identifiers and eight MiniMax voice IDs in the Worker environment. Do not expose any provider configuration to browser code. Verify official base URLs during the relevant implementation phase instead of guessing them during scaffolding.

---

# 37. Production Architecture

Expected public architecture:

```text
User Browser
     │
     ▼
Cloudflare Pages
     │
     ▼
Cloudflare Worker
     ├── /api/polish ──── AccentForge Language Service ──── Kimi
     ├── /api/generate ── AccentForge Language Service ──── Kimi
     └── /api/speech ──── AccentForge Speech Service ───── MiniMax
```

---

## Deployment Acceptance Criteria

A new user must be able to access the public URL and complete the entire workflow without:

- registration;
- login;
- installation;
- API keys;
- technical documentation.

The deployed site must visually match `DESIGN_SYSTEM.md`.

Production deployment must not introduce visual changes that were not present in the approved static UI.

---

## Suggested Commit

```text
deploy: publish AccentForge public beta
```

---

# 38. Phase 9 — QA

Do not release V1 after only happy-path testing.

Create:

```text
tests/qa-cases.md
```

---

# 39. Required QA Matrix

Test:

### IELTS Part

3 states:

- Part 1
- Part 2
- Part 3

### Target Band

5 states:

- 5
- 6
- 7
- 8
- 9

Minimum logical matrix:

**3 × 5 = 15 core combinations**

---

# 40. Input Quality Cases

Also test:

### Very Short

```text
我喜欢咖啡。
```

### Fragmented

```text
城市，工作多，工资，贵，压力，也方便。
```

### Repetitive

Repeated ideas.

### Colloquial

Highly conversational Chinese.

### Near Limit

Close to 1000 characters.

### Empty

Must reject.

### Over Limit

Must reject.

---

# 41. Content QA

Check:

## Meaning Preservation

Does AI preserve the learner's intended opinion?

## Part Fit

Does the response fit Part 1, Part 2 or Part 3?

## Band Fit

Does difficulty match the selected Target Band?

## Naturalness

Would a real person plausibly say it?

## Speakability

Can a learner realistically reproduce it?

## Authenticity

Did AI avoid inventing major personal facts?

## Idiomaticity

Are expressions natural rather than forced?

## Logic

Does the answer progress coherently?

---

# 42. Voice QA

Check:

- all 8 Accent × Voice combinations;
- correct accent profile;
- correct voice presentation;
- reasonable pacing;
- natural rhythm;
- no broken audio;
- no automatic unnecessary generation.

---

# 43. UX QA

Test on:

- desktop Chrome;
- desktop Edge;
- Safari if practical;
- mobile layout.

Check:

- buttons;
- character counter;
- responsive layout;
- loading states;
- disabled states;
- error states;
- stale content behaviour;
- segmented control states;
- editor readability;
- audio controls.

---

# 44. Visual QA

Visual QA is mandatory.

Compare the deployed product against `DESIGN_SYSTEM.md`.

Check:

- approved three-colour system;
- typography hierarchy;
- whitespace;
- card radius;
- subtle shadows;
- segmented controls;
- button styling;
- desktop two-column balance;
- mobile layout;
- absence of visual clutter.

Reject the build if it introduces:

- unnecessary colours;
- generic AI gradients;
- oversized marketing content;
- excessive shadows;
- dashboard styling;
- decorative visual noise;
- inconsistent border radii;
- inconsistent button treatment;
- poor spacing hierarchy.

---

# 45. Phase 10 — Documentation

Only after the product works should Codex finish the public-facing repository documentation.

---

# 46. README Requirements

The README must include:

## Product Name

**AccentForge**

## Short Description

Suggested:

> AccentForge is an AI-powered IELTS Speaking tool that turns fragmented Chinese thoughts into structured ideas, natural spoken English, and accent-aware audio.

---

## Live Demo

Public website link.

---

## Screenshot

Show the real production interface.

The screenshot should reflect the approved visual system.

---

## Problem

Explain the learner problem.

---

## Solution

Explain:

```text
Raw Idea
→ Structured Chinese
→ IELTS Speaking English
→ Voice
```

---

## Features

Only actual V1 features.

---

## Architecture

Show:

```text
React/Vite
→ Cloudflare Pages
→ Cloudflare Workers
→ Kimi + MiniMax
```

Explain that Kimi performs Chinese idea structuring and IELTS spoken-English generation, while MiniMax performs speech synthesis. Do not imply that either provider is affiliated with IELTS.

---

## IELTS Design Principles

Summarise:

- Part 1/2/3 differences;
- Target Band philosophy;
- naturalness over complexity;
- no score prediction.

---

## Technology

List the actual technology used.

---

## Design

Briefly explain the interface philosophy:

- minimal;
- distraction-free;
- Apple-inspired;
- restrained three-colour system;
- focused on the learner's core workflow.

Do not claim affiliation with Apple.

---

## Limitations

Be explicit.

Examples:

- Target Band is not a score prediction;
- synthetic accents cannot represent all regional variation;
- AI output may require learner judgement;
- Part 2 timing varies by speaking speed;
- generated content is educational guidance.

---

## Disclaimer

Include IELTS independence disclaimer.

---

# 47. Architecture Documentation

Create:

```text
docs/architecture.md
```

Explain:

- frontend;
- backend;
- Kimi text-generation flow;
- MiniMax speech-synthesis flow;
- `TextGenerationProvider` and `KimiTextProvider` boundaries;
- `SpeechSynthesisProvider` and `MiniMaxSpeechProvider` boundaries;
- normalised results and provider-neutral errors;
- centralised environment and voice-profile configuration;
- prompt layers;
- separation between pedagogical prompts and provider transport;
- security boundaries;
- API flow.

Keep it understandable to technical reviewers.

---

# 48. Evaluation Documentation

Create:

```text
docs/evaluation.md
```

Describe:

- Kimi Part testing;
- Kimi Band testing;
- MiniMax testing of all eight fixed voice profiles;
- provider reliability and normalised error behaviour;
- known failure modes;
- prompt iteration;
- visual QA where relevant.

Do not fabricate benchmark percentages unless actually measured.

---

# 49. Limitations Documentation

Create:

```text
docs/limitations.md
```

Include:

- model variability;
- artificial voice limitations;
- Target Band limitations;
- IELTS non-affiliation;
- possible cultural bias;
- possible over-generation;
- inability to replace a qualified teacher.

---

# 50. Demo Evidence

Before the public website is ever shut down, preserve:

- screenshots;
- one short GIF;
- one short demo video if practical;
- several example outputs;
- representative audio samples.

Recommended demo cases:

```text
Part 1 — Band 5
Part 2 — Band 7
Part 3 — Band 9
British Female
American Male
Australian Female
Canadian Male
```

Store appropriate materials in:

```text
assets/
```

Screenshots and demo assets should reflect the final production design.

---

# 51. Git Commit Strategy

Do not build the entire project and push it in one final commit.

The repository should show meaningful development progression.

Recommended commit sequence:

```text
chore: initialise AccentForge project structure

feat: build AccentForge static interface

feat: implement complete mock workflow

chore: migrate provider architecture to Kimi and MiniMax

feat: add Kimi IELTS idea structuring prompts

feat: integrate Kimi Chinese idea structuring API

test: add Chinese structuring evaluation cases

feat: add Kimi IELTS English generation engine

test: evaluate target band differentiation

feat: add MiniMax accent-aware speech generation

test: verify eight voice combinations

feat: add production security and usage controls

deploy: publish AccentForge public beta

docs: add architecture and evaluation documentation

docs: complete project README

release: AccentForge v1.0.0
```

Do not create fake historical commits.

Commits should correspond to real development work.

---

# 52. GitHub Repository Quality

Before V1 release confirm:

- no API keys;
- no `.env`;
- no unnecessary generated files;
- no debug logs;
- no unused dependencies;
- no dead code;
- no placeholder text;
- no temporary fake data still active;
- no broken links;
- no private personal information;
- no accidental screenshots containing credentials.

---

# 53. V1 Release Criteria

AccentForge V1.0.0 may be released only when all of the following are true.

## Product

- Part 1/2/3 works.
- Target Band 5–9 works.
- Chinese input accepts up to 1000 characters.
- Polish My Idea works.
- polished Chinese remains editable.
- Generate English works.
- 4 accents work.
- 2 voice options work.
- Read Aloud works.

---

## AI

- meaning is preserved;
- major personal facts are not fabricated;
- Part behaviour is differentiated;
- Band behaviour is differentiated;
- English sounds spoken;
- no deliberate errors are introduced;
- Band 9 does not become artificial.

---

## Technical

- frontend is deployed;
- Worker is deployed;
- Kimi and MiniMax API secrets are protected;
- rate limiting exists;
- bot protection exists;
- provider usage and budget monitoring exists;
- errors are handled.

---

## UX

- no account required;
- no API key required;
- no installation required;
- workflow is understandable without instructions.

---

## Design

- frontend complies with `DESIGN_SYSTEM.md`;
- approved three-colour system is used;
- visual hierarchy is consistent;
- whitespace is generous;
- interface feels premium and restrained;
- no unapproved visual system has been introduced;
- mobile and desktop both feel intentionally designed.

---

## GitHub

- README complete;
- screenshots included;
- architecture documented;
- evaluation documented;
- limitations documented;
- commit history reflects real development.

---

# 54. Release

Create:

```text
v1.0.0
```

Release title:

**AccentForge V1.0**

Suggested release summary:

> Initial public release of AccentForge, an AI-powered IELTS Speaking tool for structuring Chinese ideas, generating level-aware spoken English, and practising answers with selectable English accents and voices.

---

# 55. Post-Release Rule

After V1.0 release:

Do not immediately add new features.

Observe:

- output quality;
- API reliability;
- unexpected costs;
- user misunderstandings;
- obvious bugs;
- visual inconsistencies.

Only fix:

- bugs;
- severe UX issues;
- prompt failures;
- security issues;
- serious visual defects.

New functionality requires explicit approval and a new product specification version.

---

# 56. Project Shutdown / Archive Plan

AccentForge is intended to remain publicly available during the relevant student application period.

When the public service is no longer required:

1. disable the paid Kimi and MiniMax endpoints;
2. remove or rotate both active production API credentials;
3. preserve the GitHub repository;
4. preserve screenshots;
5. preserve demo GIF/video;
6. preserve representative audio examples;
7. preserve architecture and evaluation documentation;
8. preserve the final design assets.

The repository should remain public if appropriate.

The README may change to:

```text
Live public demo archived.
```

Do not delete the project merely because the hosted AI service has been shut down.

---

# 57. Final Instruction to Codex

Build exactly the product defined in:

- `PRODUCT_SPEC.md`
- `IELTS_AGENT_RULES.md`
- `CODEX_BUILD_BRIEF.md`
- `DESIGN_SYSTEM.md`

Use incremental implementation.

Use mock data before AI integration.

Integrate the frozen Kimi + MiniMax + Cloudflare stack one stage at a time.

Kimi is the only V1 text-generation provider. MiniMax is the only V1 speech-generation provider. Do not add fallback providers or a provider-selection UI.

Test each stage before moving forward.

Do not add features that are not specified.

Do not introduce visual styles that are not specified.

Do not expose secrets.

Do not prioritise technical complexity over product simplicity.

Do not prioritise decorative design over clarity.

The final product must feel simple to the learner even if the internal implementation is sophisticated.

The frontend must feel:

**premium, calm, minimal, spacious and intentional.**

The core product standard is:

**A non-technical IELTS learner should be able to open AccentForge and immediately understand how to use it.**

The core visual standard is:

**The interface should communicate confidence through restraint.**

The engineering should remain invisible to the user.
