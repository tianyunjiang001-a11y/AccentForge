# Phase 4 Chinese Structuring Evaluation

Run the Worker with a valid server-side Kimi configuration, then execute:

```powershell
pnpm qa:phase4 > tests/phase4/latest-results.json
```

Run the additional sparse Part 2 controlled-enrichment cases with:

```powershell
pnpm qa:phase4:enrichment > tests/phase4/enrichment-results.json
```

The runner waits 21 seconds between cases by default to stay within the
baseline account's request-rate limit. Set `PHASE4_CASE_DELAY_MS` when a
different verified provider limit applies.

The original 15 cases cover five Part 1, five Part 2 and five Part 3 inputs, including short, fragmented, repetitive, colloquial, poorly organised, incomplete, personal, abstract and ambiguous material. The additional set contains six deliberately sparse Part 2 inputs for controlled-narrative-enrichment regression testing.

An HTTP 200 is not a quality pass. Review every generated `structuredChinese` value for:

1. core meaning preservation;
2. Part fit;
3. logical organisation;
4. natural spoken Chinese;
5. appropriate answer depth;
6. narrative vividness;
7. story coherence;
8. plausibility;
9. controlled elaboration;
10. absence of sensitive or excessive fabrication;
11. Target Band idea density;
12. editability;
13. output-format consistency.

Do not penalize an output merely because it contains a detail absent from the raw input. Ask whether the addition helps the learner speak naturally, remains plausible and low-risk, preserves the core idea, and is easy to edit.

Do not commit `latest-results.json` if it contains private learner content. The supplied fixture inputs contain no private information.
