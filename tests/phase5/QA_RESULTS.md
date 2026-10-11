# AccentForge Phase 5 — Real Kimi QA Results

**Evaluation date:** 2026-10-12 (Asia/Shanghai)  
**Model configuration:** `kimi-k2.6`  
**Status:** Phase 5 freeze recommendation pending human approval

## Scope and evidence

The final evaluation used 18 reusable cases: six for each Speaking Part. All
requests used the real `/api/generate` route, the existing Kimi provider layer
and a 21-second interval. The complete Structured Chinese inputs, full English
outputs, response statuses and timings are recorded in:

- `latest-results.json` — final 18-case run against the calibrated prompt;
- `initial-results.json` — original 18-case run before the evidence-driven
  band-calibration adjustment;
- `calibrated-band-results.json` — focused nine-case rerun covering the three
  Band 5/7/9 semantic groups.

All three runs completed without a provider error or rate-limit response:

| Run                  | Successful | Total | Purpose                                   |
| -------------------- | ---------: | ----: | ----------------------------------------- |
| Initial baseline     |         18 |    18 | Establish Phase 5 behaviour               |
| Focused calibration  |          9 |     9 | Verify the Band 7/9 flattening adjustment |
| Final current prompt |         18 |    18 | Evaluate the code proposed for freeze     |

The final run averaged 3.27 seconds per request. No raw provider response or
provider detail was returned to the browser-facing contract.

## Human QA result by case

`Pass with note` means the answer is usable and contains no new substantive
biography, but exposes a calibration issue worth retaining for later QA.

| Case                   | Result         | Human assessment                                                                                                                                                      |
| ---------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `p1-coffee-band5`      | Pass           | Clear, direct, reproducible and faithful; no artificial errors.                                                                                                       |
| `p1-coffee-band7`      | Pass           | Natural spoken opening, stronger paraphrase and rhythm without extra facts.                                                                                           |
| `p1-coffee-band9`      | Pass with note | Concise and natural, but the quality step above Band 7 remains modest.                                                                                                |
| `p1-weekend-band6`     | Pass           | Convincing everyday speech; “can't be bothered” and “switching off” fit the meaning.                                                                                  |
| `p1-city-band8`        | Pass           | Compact, flexible and balanced; no mini-essay behaviour.                                                                                                              |
| `p1-reading-band5`     | Pass           | Accessible and natural; the spoken chunks remain manageable for Band 5.                                                                                               |
| `p2-camera-band5`      | Pass           | Straightforward sustained description with accurate semantic boundaries.                                                                                              |
| `p2-camera-band7`      | Pass with note | Strong rhythm, but “slightly faded,” “sharp, saturated,” and “more about the process than the result” are low-risk descriptive inferences beyond the exact Chinese.   |
| `p2-camera-band9`      | Pass with note | Natural and concise, but not consistently more controlled or nuanced than the Band 7 version.                                                                         |
| `p2-sunrise-band6`     | Pass           | Coherent story flow, natural reflection and no added event or biography.                                                                                              |
| `p2-scarf-band8`       | Pass with note | Vivid and speakable; “she's not a professional” is an unnecessary inference and “irreplaceable” slightly intensifies the source.                                      |
| `p2-teacher-band7`     | Pass with note | Natural development; the final claim about changing the learner's wider approach to learning goes beyond the supplied reflection.                                     |
| `p3-transit-band5`     | Pass           | Direct, correct reasoning with simple, manageable structures.                                                                                                         |
| `p3-transit-band7`     | Pass           | Clear cause/effect, qualification and natural spoken linking.                                                                                                         |
| `p3-transit-band9`     | Pass           | Economical, nuanced and conversational; sophistication comes from control rather than rare words.                                                                     |
| `p3-remote-work-band6` | Pass           | Balanced reasoning in accessible spoken English.                                                                                                                      |
| `p3-education-band8`   | Pass           | Excellent spoken analysis, collocations and rhythm without academic prose.                                                                                            |
| `p3-city-policy-band9` | Pass with note | Strong concise reasoning, but “public transport is already dense” is an unnatural Chinese-to-English collocation; “the network is extensive” would be more idiomatic. |

Final disposition: 12 clean passes, six passes with notes, zero unusable cases.

## Sixteen-criterion review

1. **Semantic fidelity:** strong overall; three Part 2 answers contain minor
   descriptive or reflective expansion.
2. **Semantic Lock:** no substantive biographical additions in any final case.
3. **Spoken naturalness:** consistently strong.
4. **Absence of translationese:** strong apart from one “public transport is
   dense” collocation.
5. **Part fit:** clearly differentiated across Parts 1, 2 and 3.
6. **Target Band fit:** generally sound; upper-band separation remains modest
   in short Part 1 and descriptive Part 2 material.
7. **Natural collocations:** strong overall.
8. **Sentence rhythm:** varied and speakable.
9. **Discourse-marker restraint:** good; no answer was overloaded.
10. **Grammatical range:** appropriate progression without deliberate lower-band
    errors.
11. **Lexical precision:** strong, with a single clear collocational miss.
12. **Idiomaticity:** natural and restrained; no forced idiom was found.
13. **Speakability:** strong throughout.
14. **Absence of essay language:** no flagged essay transition or conclusion
    formula was found.
15. **Absence of new substantive biography:** all 18 cases passed.
16. **Overall authenticity:** strong; outputs generally sound like plausible
    IELTS speech rather than model essays.

No output contained an intentional hesitation filler (`um`, `uh`, `erm`). All
18 outputs conformed to the normalized `{ "spokenEnglish": "..." }` contract.

## Part contrast

| Part   | Final word range | Average | Observed identity                                                                           |
| ------ | ---------------: | ------: | ------------------------------------------------------------------------------------------- |
| Part 1 |            39–45 |      43 | Direct answer, reason and compact detail; no mini essays.                                   |
| Part 2 |           89–125 |     107 | Sustained description or narrative with emotion/reflection bounded by the Chinese source.   |
| Part 3 |           59–105 |      85 | Analytical cause/effect, qualification and comparison in spoken rather than academic prose. |

Part 2 outputs do not reach 1:45–2:00 when the Structured Chinese lacks enough
material. This is correct Semantic Lock behaviour: Phase 5 must not invent
biography to hit a duration target.

## Band 5/7/9 contrasts

### Part 1 — coffee

- Band 5 is direct and reproducible: “I quite like coffee ...”
- Band 7 uses more flexible spoken paraphrase and rhythm: “I'm quite into
  coffee ... I tend to feel pretty groggy ...”
- Band 9 remains concise and controlled, but does not clearly outperform Band 7
  on this simple input.

The original baseline produced identical Band 7 and Band 9 answers. After the
calibration rule, all three are distinct without length inflation. The remaining
Band 7/9 quality gap is small and should be treated as a K2.6 limitation.

### Part 2 — old camera

- Band 5 uses direct explanation and simple links.
- Band 7 uses more imagery, reformulation and reflective framing.
- Band 9 is concise and fluent, but Band 7 sometimes appears more developed.

Length is not driving the target: final outputs are 89, 108 and 94 words. The
weakness is inconsistent upper-band ranking, not simple verbosity.

### Part 3 — public transport

- Band 5 states the position, causal chain and qualification plainly.
- Band 7 adds natural paraphrase, a conditional relationship and local-policy
  qualification.
- Band 9 is more economical while retaining nuance through “no
  one-size-fits-all” and “what actually works on the ground.”

This group shows the intended progression through control and precision rather
than rare vocabulary. Final lengths are 59, 105 and 81 words.

## Best examples

- `p3-education-band8`: the strongest balance of spoken authenticity,
  analytical depth, collocation and rhythm.
- `p2-sunrise-band6`: coherent natural storytelling that remains fully inside
  the supplied experience.
- `p3-transit-band9`: concise, nuanced reasoning without academic language.
- `p1-weekend-band6`: highly natural everyday speech with restrained informal
  phrasing.

## Weakest examples and recurring weaknesses

- `p2-camera-band7` is the clearest case of descriptive inference beyond the
  exact source, although it does not invent biography.
- `p2-teacher-band7` adds a wider learning consequence not explicitly stated.
- `p3-city-policy-band9` contains the only clear translationese-like
  collocation.
- Band 7 versus Band 9 differentiation is still inconsistent for semantically
  simple Part 1 and descriptive Part 2 inputs. It is reliable on analytical
  Part 3 material.

No recurring essay-language, forced-idiom, discourse-marker, repetitive-syntax
or new-biography failure was observed.

## Evidence-driven style adjustment

The initial run showed exact Band 7/9 duplication in Part 1 and a Band 9 Part 2
answer that was not stronger than Band 7. One targeted rule was added to the
guide and prompt: calibrate bands deliberately while keeping meaning and length
broadly comparable, using reproducible directness at Band 5, controlled variety
at Band 7, and economical precision and nuance at Band 9. It explicitly forbids
manufacturing content to create a difference.

The focused and final reruns removed exact duplication and improved Part 3
progression. No further rules were added for isolated wording issues.

## Phase 4 known limitation retained for Phase 9

Controlled Narrative Enrichment remains valuable and enabled. Kimi can
occasionally make Phase 4 details overly specific. End-to-end QA must retain
regressions for sensitive additions, excessive biography, specific achievements
and unnecessary named entities. Phase 5's Semantic Lock prevented that detail
from compounding in this set.

## Freeze recommendation

Phase 5 is suitable for a conditional freeze. The integration, Semantic Lock,
Part identities and overall spoken style are strong enough to proceed after
human approval. Retain the documented upper-band differentiation and occasional
low-risk semantic expansion as Phase 9 regression targets.

Do not change `SPEAKING_STYLE_GUIDE.md` from **Frozen Candidate — Phase 5
Calibration** to **Frozen Speaking Style Specification** until the product owner
explicitly approves it.
