# AccentForge — Product Specification

**Version:** 1.0  
**Status:** Frozen Product Specification  
**Product Type:** Public AI-powered IELTS Speaking learning tool  
**Core Platforms:** OpenAI + Cloudflare

---

## 1. Product Summary

AccentForge is a free, browser-based AI tool designed for IELTS Speaking learners who know roughly what they want to say but struggle to organise their ideas and express them naturally in spoken English.

The product transforms a learner's rough Chinese thoughts through three stages:

**Raw Chinese Idea → Structured Chinese Answer → IELTS Speaking English → Spoken Audio**

AccentForge is not a general translation tool and is not an IELTS score predictor.

Its purpose is to help learners:

- organise fragmented ideas into a coherent answer;
- understand how an IELTS Speaking response can be structured;
- convert those ideas into natural, level-appropriate spoken English;
- listen to the final answer in a preferred English accent and voice.

---

## 2. Core Product Principle

AccentForge should feel as simple as Google Translate.

The user should not need to understand:

- APIs;
- AI models;
- local deployment;
- Python;
- GitHub;
- prompt engineering;
- software configuration.

A normal user should be able to open the website and immediately use the tool.

No registration is required.

No API key is required from the user.

No payment is required.

---

## 3. Primary User

The primary user is a Chinese-speaking IELTS learner preparing for the IELTS Speaking test.

Typical user problem:

> "I know roughly what I want to say, but I cannot organise it clearly in Chinese, and even when I can, I do not know how to express it naturally in spoken English."

Secondary users may include:

- IELTS teachers;
- adult English learners;
- international education students;
- English speaking and shadowing learners.

---

## 4. V1 User Journey

### Step 1 — Select IELTS Speaking Part

The user chooses one:

- Part 1
- Part 2
- Part 3

A part must be selected before generation.

---

### Step 2 — Select Target Band

The user chooses one:

- Band 5
- Band 6
- Band 7
- Band 8
- Band 9

The interface must call this **Target Band**, not predicted band or estimated score.

Target Band controls the expected complexity, flexibility and sophistication of the generated answer.

It does not guarantee or predict an IELTS score.

---

### Step 3 — Enter Raw Chinese Idea

The user enters up to:

**1000 Chinese/Unicode characters**

The input may be:

- incomplete;
- fragmented;
- repetitive;
- poorly organised;
- colloquial;
- grammatically imperfect;
- written as bullet-like thoughts.

The system should not require the learner to produce well-structured Chinese before using the tool.

Example:

> 我喜欢大城市，工作多，方便，但是人很多，我以后可能还是想住大城市，因为年轻的时候机会重要。

---

### Step 4 — Polish My Idea

The user clicks:

**Polish My Idea**

AccentForge restructures the Chinese input according to:

- the selected IELTS Speaking Part;
- the selected Target Band;
- natural oral reasoning;
- appropriate answer depth;
- logical sequencing.

The result remains in Chinese.

The purpose of this stage is not translation.

It is **idea organisation and answer construction**.

The polished Chinese should be displayed in the left-side editor and remain editable by the user.

The user may manually change the polished Chinese before generating English.

---

## 5. Part-Specific Chinese Structuring

### Part 1

The polished answer should be:

- concise;
- personal;
- direct;
- conversational;
- lightly developed.

Typical structure:

**Direct answer → Reason → Small detail/example**

The answer should normally feel appropriate for roughly **15–30 seconds of speech**.

It must not become a miniature essay.

---

### Part 2

The polished answer should support a natural long turn approaching the IELTS two-minute speaking window.

Typical structure may include:

**Context → Person/place/event → Development → Specific detail → Feeling/reflection → Why it matters**

The structure must remain flexible and topic-dependent.

The system should aim for enough content to support approximately **1 minute 45 seconds to 2 minutes of natural speech**, without forcing an exact word count.

Part 2 should feel like coherent storytelling or sustained description, not an essay.

IELTS officially defines Part 2 as an individual long turn with one minute of preparation and speaking for up to two minutes.

---

### Part 3

The polished answer should support more developed reasoning about general or abstract issues.

Typical structure may include:

**Position → Reason → Explanation → Example → Qualification/alternative → Conclusion**

Not every response must contain every element.

The system should prioritise:

- reasoning;
- explanation;
- comparison;
- causes and consequences;
- qualification;
- balanced judgement where appropriate.

Part 3 should be freer in length than Part 1 and should not be forced into a fixed script.

IELTS officially describes Part 3 as a deeper discussion of more general and abstract issues related to Part 2.

---

## 6. Generate IELTS Speaking English

After reviewing or editing the polished Chinese, the user clicks:

**Generate English**

AccentForge converts the structured Chinese into:

**IELTS Speaking Version**

This is not literal translation.

The system should reconstruct the content as natural spoken English while preserving the learner's intended meaning.

The output should reflect:

- the selected Part;
- the selected Target Band;
- natural spoken rhythm;
- appropriate vocabulary;
- appropriate grammatical complexity;
- natural collocations;
- appropriate idiomatic language;
- spoken rather than written style.

The result appears in the right-side editor.

---

## 7. Target Band Behaviour

Target Band is a **generation profile**, not a score prediction.

### Band 5

Prioritise:

- accessibility;
- clear meaning;
- common vocabulary;
- relatively simple structures;
- straightforward development;
- easy reproduction by a learner.

Do not deliberately introduce mistakes.

---

### Band 6

Prioritise:

- generally natural spoken language;
- clear development;
- some structural variety;
- some paraphrasing;
- useful everyday collocations;
- moderate complexity.

---

### Band 7

Prioritise:

- flexible expression;
- natural collocations;
- effective paraphrasing;
- varied sentence structures;
- appropriate spoken discourse markers;
- some natural idiomatic language;
- well-developed but still speakable ideas.

---

### Band 8

Prioritise:

- broad and precise vocabulary;
- flexible grammar;
- natural reformulation;
- nuanced expression;
- confident idiomatic language where appropriate;
- sophisticated but clearly spoken delivery.

---

### Band 9

Prioritise:

- highly precise meaning;
- very flexible language;
- natural and sustained idiomaticity;
- subtle qualification;
- effortless-sounding spoken organisation;
- sophisticated language without unnecessary complexity.

Band 9 must **not** mean:

- obscure vocabulary;
- forced slang;
- excessive idioms;
- academic prose;
- unnatural complexity.

Higher bands should become more **precise, flexible and natural**, not merely more difficult.

IELTS Speaking is assessed equally across Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation.

---

## 8. Voice Playback

After English generation, the user chooses:

### Accent

- British
- American
- Australian
- Canadian

### Voice

- Female
- Male

This creates eight possible listening combinations.

Only the selected combination should be generated when the user presses:

**▶ Read Aloud**

The system must never pre-generate all eight combinations.

Accent selection is a listening and shadowing preference.

Accent selection must not be presented as affecting the user's IELTS score.

IELTS assesses pronunciation primarily through comprehensibility and control of pronunciation features rather than conformity to a single national accent.

---

## 9. Audio Behaviour

Generated speech should be:

- clear;
- natural;
- conversational;
- suitable for IELTS Speaking practice;
- moderately paced;
- easy to shadow;
- non-theatrical.

Accents should sound recognisable but should not become exaggerated stereotypes.

Suggested accent profiles:

**British:** clear contemporary standard British speech  
**American:** clear General American speech  
**Australian:** clear contemporary General Australian speech  
**Canadian:** clear contemporary General Canadian speech

Male and Female represent two distinct synthetic voice presentations.

---

## 10. Page Structure

The V1 website should be a single-page application.

Recommended layout:

**Header**

AccentForge  
*From scattered thoughts to spoken English.*

---

**Controls**

Speaking Part:

`Part 1 | Part 2 | Part 3`

Target Band:

`5 | 6 | 7 | 8 | 9`

---

**Main Workspace**

Left:

**What I Want to Say**

Chinese input / polished Chinese editor

Character counter:

`0 / 1000`

Button:

**Polish My Idea**

Right:

**IELTS Speaking Version**

Generated English editor

Button:

**Generate English**

---

**Voice Controls**

Accent:

`British | American | Australian | Canadian`

Voice:

`Female | Male`

Button:

**▶ Read Aloud**

Audio player appears after generation.

---

**Footer**

Short educational disclaimer.

GitHub link.

Contact information.

Suggested deployment text:

> For educational collaboration or deployment enquiries, please contact us.

No local deployment instructions should appear in the normal user-facing website.

---

## 11. Interaction Rules

No AI request should be triggered while the user is typing.

Every AI request must follow an explicit user action.

**Polish My Idea** triggers only Chinese idea structuring.

**Generate English** triggers only English generation.

**Read Aloud** triggers only speech generation.

Changing Accent or Voice must not regenerate Chinese or English.

Changing Part or Target Band makes previous generated content stale and should require regeneration.

Editing the polished Chinese after English generation makes the existing English version stale.

The interface should clearly guide the user forward without exposing technical state.

---

## 12. Error Handling

Errors must be expressed in plain language.

Examples:

**Temporary AI failure**

> Something went wrong while generating your answer. Please try again.

**Character limit**

> Please keep your idea within 1000 characters.

**Usage limit**

> Today's public usage limit has been reached. Please try again later.

Do not expose:

- stack traces;
- model names;
- API status codes;
- secret keys;
- backend implementation details.

---

## 13. Cost-Control Requirements

V1 must minimise unnecessary API consumption.

Required rules:

- maximum 1000-character input;
- no generation while typing;
- Chinese structuring only after explicit click;
- English generation only after explicit click;
- TTS only after Read Aloud;
- only one accent/voice combination generated per request;
- server-side rate limiting;
- bot protection;
- project-level API spending ceiling;
- API credentials stored only on the backend.

The public product should remain free to users during its active application-cycle deployment.

---

## 14. Technical Architecture

### Frontend

**React + Vite**

Hosted using:

**Cloudflare Pages**

### Backend

**Cloudflare Workers**

Responsibilities:

- receive frontend requests;
- validate inputs;
- enforce limits;
- protect API credentials;
- communicate with OpenAI;
- return structured responses/audio.

### AI

**OpenAI**

Used for:

1. Chinese idea structuring;
2. IELTS spoken-English generation;
3. text-to-speech.

### Database

None in V1.

### User Accounts

None in V1.

---

## 15. Explicit V1 Non-Goals

AccentForge V1 must NOT include:

- user registration;
- login;
- saved history;
- cloud profiles;
- subscriptions;
- payments;
- advertisements;
- speaking score prediction;
- automatic IELTS scoring;
- microphone recording;
- speech recognition;
- pronunciation correction;
- pronunciation scoring;
- vocabulary quizzes;
- flashcards;
- AI chat;
- IELTS mock examinations;
- Part 1 question banks;
- Part 2 cue-card databases;
- Part 3 question databases;
- downloadable MP3;
- social sharing;
- automatic local deployment.

These are outside V1 unless the product specification is formally revised.

---

## 16. Educational Disclaimer

Suggested footer text:

> AccentForge is an independent educational tool for IELTS Speaking practice. Target Band settings guide language complexity and style; they do not predict or guarantee an IELTS score. IELTS is a registered trademark of its respective owners. AccentForge is not affiliated with or endorsed by IELTS.

---

## 17. Success Criteria for V1

AccentForge V1 is complete when a first-time user can:

**Open website → Select Part → Select Target Band → Enter Chinese → Polish Idea → Review/Edit Chinese → Generate IELTS English → Select Accent → Select Voice → Hear Audio**

without:

- creating an account;
- reading technical instructions;
- supplying an API key;
- installing software;
- understanding how the backend works.

The entire normal workflow should exist on one page.