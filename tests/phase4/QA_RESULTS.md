# Phase 4 Controlled Narrative Enrichment QA

## Scope and artifacts

- Evaluation date: 2026-10-11
- Model: the approved Kimi K2.6 configuration
- Original comparison set: 15 unchanged cases
- Additional regression set: 6 deliberately sparse Part 2 cases
- Previous full outputs: `baseline-results.json`
- New full outputs for the original set: `latest-results.json`
- New full outputs for the sparse Part 2 set: `enrichment-results.json`
- Previous human assessment: `BASELINE_QA_RESULTS.md`

Both new runs used the existing 21-second request pacing. The original set
returned 15/15 successful normalized responses; the additional set returned
6/6. No request reached the provider rate limit.

| Set           | Success |  Average |  Minimum |   Maximum |
| ------------- | ------: | -------: | -------: | --------: |
| Original 15   |   15/15 | 5,232 ms | 1,687 ms | 11,670 ms |
| Sparse Part 2 |     6/6 | 6,717 ms | 5,327 ms | 10,669 ms |

## Previous-versus-new comparison

The two JSON result files record every previous and new output in full. This
table records the meaningful human comparison rather than treating a changed
or longer answer as an automatic improvement.

| Case                             | Meaningful difference                                                                                                 | Improved?                                             | Excessive or questionable?                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `p1-short-coffee`                | Adds a daily morning habit and work context instead of one short reason.                                              | Slightly more speakable.                              | Borderline: two personal assumptions from a one-sentence input.                                                   |
| `p1-fragmented-city`             | Adds rush-hour context while retaining convenience, jobs, crowds and noise.                                           | Yes.                                                  | No; the addition is small and general.                                                                            |
| `p1-repetitive-exercise`         | Expands into sitting all day, running or ball games, sweat and a closing metaphor.                                    | No; it is vivid but no longer compact Part 1.         | Yes; too much story and imagery for low enrichment.                                                               |
| `p1-colloquial-weekend`          | Very small natural expansion around relaxing at home.                                                                 | Yes.                                                  | No.                                                                                                               |
| `p1-ambiguous-reading`           | Adds a tired-after-work state without guessing the omitted media object.                                              | Slightly.                                             | Borderline but low-risk and editable.                                                                             |
| `p2-personal-teacher`            | Changes a compact teacher story into a named high-school English teacher, several scenes, dialogue and later effects. | Vivid, but not controlled.                            | Yes; named person, multiple invented episodes and excessive biography.                                            |
| `p2-poorly-organised-trip`       | Builds one sunrise sequence with arrival, early wake-up, colour and return journey.                                   | Yes; more memorable and coherent.                     | Minor concern: exact time and accommodation add more than necessary, but the thread stays plausible and low-risk. |
| `p2-fragmented-object`           | Adds parents' ownership, film-camera mechanics, several locations and a detailed photography philosophy.              | Partly; stronger story and reflection.                | Yes; too many mutually dependent details are piled onto one object.                                               |
| `p2-repetitive-event`            | Invents a university English debate, exact preparation routine, third place and a lasting lesson.                     | No; specificity overwhelms the learner's sparse idea. | Yes; highly specific achievement and biography.                                                                   |
| `p2-incomplete-hobby`            | Develops one everyday cooking-learning thread around tomato and eggs.                                                 | Yes; natural, coherent and memorable.                 | Acceptable: detailed but low-risk, familiar and easy to replace.                                                  |
| `p3-short-remote-work`           | Adds a general workplace example and preserves the stated trade-off.                                                  | Yes.                                                  | No.                                                                                                               |
| `p3-fragmented-technology`       | Uses the learner's supposed grandparents as a personal example.                                                       | Reasoning is clearer.                                 | Yes; personal biography is unnecessary in Part 3. A hypothetical older person would be better.                    |
| `p3-repetitive-public-transport` | Adds pollution, parking and city-size qualifications.                                                                 | Yes.                                                  | No; these are general reasoning additions.                                                                        |
| `p3-colloquial-education`        | Adds a qualified group-work example.                                                                                  | Yes.                                                  | No.                                                                                                               |
| `p3-ambiguous-city-policy`       | Adds policy types, income effects and an environment/fairness balance.                                                | Yes.                                                  | No; the elaboration is general rather than biographical.                                                          |

### Original-set assessment

- Clearly useful and controlled: 10/15
- Borderline but still low-risk/editable: 1/15 (`p2-poorly-organised-trip`)
- Excessive or Part-inappropriate: 4/15 (`p1-repetitive-exercise`, `p2-personal-teacher`, `p2-fragmented-object`, `p2-repetitive-event`)
- Additional Part 3 biography concern: `p3-fragmented-technology`

Compared with the strict baseline, the new prompt reliably increases vividness
and story development. It does not reliably stop after one or two additions.

## Sparse Part 2 regression cases

| Case                          | Core enrichment                                                                                                | Assessment                                                                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `p2-sparse-old-camera`        | Makes the camera a grandfather's gift, adds lessons, repeated park visits, illness and an implied bereavement. | Fail. Coherent and vivid, but it introduces explicitly prohibited health/bereavement implications and stacks many events. |
| `p2-sparse-meaningful-object` | Makes the scarf a mother's handmade gift from the learner's first working winter.                              | Pass. Relationship, approximate time, small scene and emotional meaning form one plausible low-risk thread.               |
| `p2-sparse-admired-person`    | Makes the person a university roommate with CET attempts, an IELTS 7.5 result and a UK exchange.               | Fail. Highly specific achievements and a long invented biography exceed controlled scaffolding.                           |
| `p2-sparse-memorable-place`   | Adds a nearby park, a bench, ordinary visitors, reading and a later move.                                      | Pass. Vivid sensory detail supports one calm, editable thread.                                                            |
| `p2-sparse-useful-skill`      | Adds learning basic dishes while living alone and later cooking for friends.                                   | Pass with minor excess. The thread is plausible and pedagogically useful, though it contains more than two added details. |
| `p2-sparse-event`             | Turns the event into a school art festival and guitar performance.                                             | Pass with minor excess. The invented event type is low-risk and gives the learner a coherent editable story.              |

### Additional-set assessment

- Useful and controlled: 4/6
- Excessive or prohibited: 2/6
- Most serious violation: the old-camera output's illness/bereavement implication

## Thirteen-criterion human assessment

| Criterion                                         | Assessment                                                                                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Core meaning preservation                      | Strong. All 21 outputs retain the supplied topic, preference or position; none directly contradicts the raw input.                     |
| 2. Part fit                                       | Mostly strong. One Part 1 exercise answer is substantially too developed.                                                              |
| 3. Logical organisation                           | Strong. All outputs have an intelligible progression.                                                                                  |
| 4. Natural spoken Chinese                         | Strong. Outputs are conversational rather than essay-like.                                                                             |
| 5. Appropriate depth                              | Improved for sparse Part 2, but several answers overshoot the evidence and selected Band.                                              |
| 6. Narrative vividness                            | Strong and clearly improved over the strict baseline.                                                                                  |
| 7. Story coherence                                | Strong. Even excessive answers generally maintain a single understandable thread.                                                      |
| 8. Plausibility                                   | Generally strong; most additions are possible in ordinary life. Plausibility alone does not make the amount or sensitivity acceptable. |
| 9. Controlled elaboration                         | Inconsistent. The prompt requests one or two additions, but K2.6 often supplies many dependent details.                                |
| 10. Absence of sensitive or excessive fabrication | Not sufficient. Two new sparse cases clearly cross the boundary; several original cases over-elaborate.                                |
| 11. Target Band idea density                      | Mostly appropriate, with overdevelopment in the Band 5 teacher case and one Part 1 case.                                               |
| 12. Editability                                   | Every output is technically editable, but long interdependent invented stories require substantial learner correction.                 |
| 13. Output-format consistency                     | 21/21. Every response normalized to one non-empty `structuredChinese` string.                                                          |

## Successful narrative enrichment examples

1. The sunrise trip turns supplied facts into one chronological sequence with a
   restrained sensory moment and reflection.
2. The cooking answer uses a familiar failed-dish example and gradual learning
   to make the learner's existing idea easier to remember and speak.
3. The scarf regression case adds one relationship, approximate period and
   small domestic scene that explain why the object matters.
4. The park regression case uses ordinary visual and sound details without
   changing the learner's topic or introducing high-risk biography.

## Excessive or questionable examples

1. The teacher answer invents a name, school stage, subject, repeated classroom
   episodes, direct quotations and cross-subject impact.
2. The competition answer invents the exact competition, university year,
   preparation schedule, placement and later behavioural effect.
3. The sparse old-camera answer implies bereavement and illness, both explicitly
   prohibited, then adds several connected memories.
4. The admired-person answer invents exact exam results and an overseas exchange
   opportunity, creating a highly specific biography.
5. The Part 3 technology answer unnecessarily converts a general argument into
   a story about the learner's grandparents.

## Decision answers

### Does K2.6 now produce useful story-like Part 2 development?

Yes. It reliably turns sparse ideas into vivid, coherent and speakable stories.

### Does it preserve the learner's core meaning?

Yes, across this 21-case sample. The weakness is not core contradiction; it is
the quantity and specificity of added material.

### Does it avoid excessive story invention?

No, not reliably. The prompt's explicit limit and sensitive-topic prohibition
were both violated in the additional regression set.

### Is the quality sufficient to freeze Phase 4?

No. The narrative-enrichment direction is pedagogically promising, but K2.6's
current prompt behaviour needs human review before Phase 4 is frozen. In
particular, the product owner should decide whether another prompt-control pass
is authorized or whether additional deterministic safeguards are required.
