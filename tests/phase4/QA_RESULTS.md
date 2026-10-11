# Phase 4 Kimi Chinese Structuring QA

## Final evaluation run

- Evaluated: 2026-10-11
- Model configuration: server-side `KIMI_TEXT_MODEL` (model identifier is not exposed to the browser)
- Cases: 15 total — five each for Part 1, Part 2 and Part 3
- API success: 15/15
- Structured response consistency: 15/15
- Average provider duration: 3,999 ms
- Minimum / maximum provider duration: 1,143 ms / 10,168 ms
- Full inputs, outputs, statuses and timings: `latest-results.json`

The first unthrottled batch reached the provider rate limit after two successful
cases. The reusable runner now waits 21 seconds between cases by default. The
final run completed without a rate-limit response.

## Manual review summary

An HTTP 200 was not treated as a quality pass. Nine cases were clean across the
nine review dimensions. Six cases contain a quality concern, principally
unsupported elaboration of sparse personal material.

| Criterion                       | Clean | Observations                                                                                           |
| ------------------------------- | ----: | ------------------------------------------------------------------------------------------------------ |
| Meaning preservation            | 14/15 | The cooking case intensifies “very unsuccessful” to “completely inedible.”                             |
| Speaking Part fit               | 15/15 | Part 1 stayed concise, Part 2 remained narrative and Part 3 used reasoning.                            |
| Logical organisation            | 15/15 | Repetition and fragments were consistently reorganised.                                                |
| Natural spoken Chinese          | 14/15 | The cooking case uses an awkward avoidance phrase about not describing the failure.                    |
| Appropriate answer depth        | 13/15 | Some sparse inputs were expanded beyond what their evidence supports.                                  |
| Target Band idea density        | 14/15 | Band shaping is visible, but the Band 5 teacher case is more developed than its source safely permits. |
| Avoidance of fabricated facts   |  9/15 | The remaining concerns are listed below.                                                               |
| Absence of essay-style language | 15/15 | No response became a formal essay.                                                                     |
| Output-format consistency       | 15/15 | Every success normalized to one non-empty `structuredChinese` string.                                  |

## Case observations

| Case                             | Review  | Observation                                                                                                                                |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `p1-short-coffee`                | Concern | Adds an unsupported morning/work-tired scenario.                                                                                           |
| `p1-fragmented-city`             | Clean   | Preserves the convenience, jobs, crowding and noise trade-off.                                                                             |
| `p1-repetitive-exercise`         | Clean   | Removes repetition without adding a new experience.                                                                                        |
| `p1-colloquial-weekend`          | Clean   | Retains the learner's colloquial tone and supplied activities.                                                                             |
| `p1-ambiguous-reading`           | Clean   | Preserves the omitted object instead of guessing what the learner watches or reads.                                                        |
| `p2-personal-teacher`            | Concern | Adds a gender and specific fears/participation details not supplied by the learner.                                                        |
| `p2-poorly-organised-trip`       | Concern | Adds that the group played for the whole day.                                                                                              |
| `p2-fragmented-object`           | Concern | Adds camera weight, batteries, storage, missed moments, composition and lighting. This is the clearest remaining anti-fabrication failure. |
| `p2-repetitive-event`            | Concern | Adds a specific internal worry during preparation and an “on-stage/on-field” moment.                                                       |
| `p2-incomplete-hobby`            | Concern | Avoids concrete invented cooking steps, but intensifies the failed result and sounds slightly unnatural.                                   |
| `p3-short-remote-work`           | Clean   | Develops the stated convenience/communication trade-off with general observations.                                                         |
| `p3-fragmented-technology`       | Clean   | Organises the generational-access issue without inventing a personal story.                                                                |
| `p3-repetitive-public-transport` | Clean   | Builds a qualified policy argument and removes repetition.                                                                                 |
| `p3-colloquial-education`        | Clean   | Preserves the balance between practical skills and foundations.                                                                            |
| `p3-ambiguous-city-policy`       | Clean   | Adds general hypotheticals while preserving the learner's fairness qualification.                                                          |

## Prompt adjustment made during QA

The Chinese Agent now explicitly requires every personal fact to be traceable to
`rawChinese`, preserves ambiguity, and prefers a shorter answer over filling in
missing details. Part 2 now states that the target duration applies only when the
learner supplied enough information. This substantially reduced unsupported
detail but did not eliminate it in all sparse Part 2 cases.

## Baseline conclusion

The Phase 4 integration is operational and reliable at the route, provider,
normalization and JSON-format levels. The approved baseline model still has a
material anti-fabrication weakness for sparse personal Part 2 inputs. This must
remain visible for human review; no model switch or K2.6-versus-K3 comparison was
performed.
