# Phase 4 Chinese Structuring Evaluation

Run the Worker with a valid server-side Kimi configuration, then execute:

```powershell
pnpm qa:phase4 > tests/phase4/latest-results.json
```

The 15 cases cover five Part 1, five Part 2 and five Part 3 inputs, including short, fragmented, repetitive, colloquial, poorly organised, incomplete, personal, abstract and ambiguous material.

An HTTP 200 is not a quality pass. Review every generated `structuredChinese` value for:

1. meaning preservation;
2. Part fit;
3. logical organisation;
4. natural spoken Chinese;
5. appropriate answer depth;
6. Target Band idea density;
7. avoidance of fabricated facts;
8. absence of essay-style language;
9. output-format consistency.

Do not commit `latest-results.json` if it contains private learner content. The supplied fixture inputs contain no private information.
