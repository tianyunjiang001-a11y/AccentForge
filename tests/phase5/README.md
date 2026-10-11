# Phase 5 Spoken-English Evaluation

Start the Worker with the server-side Kimi configuration, then run:

```powershell
pnpm qa:phase5
```

The runner writes the complete response record to `latest-results.json`.
`PHASE5_RESULTS_FILE` can select a different file, and
`PHASE5_CASE_FILTER` can select cases by `semanticGroup` for a focused
calibration rerun.

The runner waits 21 seconds between requests by default. Override
`PHASE5_CASE_DELAY_MS` only when a different provider limit has been verified.

The set contains six cases for each Speaking Part. Three semantic groups repeat
the exact same Structured Chinese at Bands 5, 7 and 9:

- Part 1 coffee;
- Part 2 old camera;
- Part 3 public transport.

Review every real output against:

1. semantic fidelity;
2. Semantic Lock compliance;
3. spoken naturalness;
4. absence of translationese;
5. Part fit;
6. Target Band fit;
7. natural collocations;
8. sentence rhythm;
9. discourse-marker restraint;
10. grammatical range;
11. lexical precision;
12. idiomaticity;
13. speakability;
14. absence of essay language;
15. absence of new substantive biography;
16. overall authenticity.

Also flag essay openings, forced idioms, excessive discourse markers,
repetitive syntax, unnecessarily long Part 1 answers, over-polished Part 2,
academic Part 3 prose and any new biography.

The fixture contains only non-private evaluation material. Do not commit result
files containing real learner content.
