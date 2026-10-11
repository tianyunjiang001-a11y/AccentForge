# AccentForge Phase 6B — Eight-Voice Calibration Report

**Evaluation date:** 2026-10-12 (Asia/Shanghai)

**Model:** `speech-2.8-turbo`

**Initial audition speed:** `1.0`

**Current Part 2 calibration candidate:** `0.52`

**Status:** Refinement candidates ready; Phase 6 is not frozen

## Scope

Phase 6B retained the frozen Kimi Chinese and English agents, Semantic Lock,
Speaking Style Guide, existing frontend appearance and Phase 6A MiniMax
transport. It did not start Phase 7, purchase or create voices, or call voice
cloning or Voice Design.

The eight logical product profiles remain present. Only profiles supported by
current official evidence were configured. Unresolved profiles are rejected by
the Worker before a MiniMax synthesis request.

## Official sources and discovery

The following current MiniMax China Mainland sources were reviewed:

- [Synchronous speech synthesis](https://platform.minimax.cn/docs/api-reference/speech-t2a-http)
- [System voice list](https://platform.minimax.cn/docs/faq/system-voice-id)
- [Query available Voice IDs](https://platform.minimax.cn/docs/api-reference/voice-management-get)
- [American-accent voice examples](https://platform.minimax.cn/audio/text-to-speech/en-us)

Two authenticated, non-synthesis `POST /v1/get_voice` requests were made with
`voice_type: system`, one during initial discovery and one during the American
Female replacement review. Both succeeded. Only non-sensitive Voice IDs, names
and official descriptions were inspected; the API key was not printed.

The current official descriptions support these regional assignments:

- `English_Graceful_Lady`: female, classic British accent;
- `English_Trustworthy_Man`: young male voice, General American accent;
- `English_Aussie_Bloke`: young male voice, Australian accent.

`English_Whispering_girl` was initially tested because its official description
identifies a General American accent, but the product owner rejected it as too
quiet and too thin. The official American-accent examples page identifies
`English_compelling_lady1` as a female Standard American candidate, but that ID
was not returned by the current China Mainland account's system-voice list.
It was therefore not synthesized or configured. No current available system
Voice ID was found with adequate evidence for American Female, British Male,
Australian Female, Canadian Female or Canadian Male. Generic English voices
were not assigned to those regions merely because they can speak English.

## Eight-profile matrix

| Accent     | Voice  | Voice ID                  | API test                      | Listening status               |
| ---------- | ------ | ------------------------- | ----------------------------- | ------------------------------ |
| British    | Female | `English_Graceful_Lady`   | 200, MP3                      | Pending human review           |
| British    | Male   | —                         | Not synthesized               | Unresolved; safely unsupported |
| American   | Female | —                         | Historical candidate rejected | Unresolved; safely unsupported |
| American   | Male   | `English_Trustworthy_Man` | 200, MP3                      | Pending human review           |
| Australian | Female | —                         | Not synthesized               | Unresolved; safely unsupported |
| Australian | Male   | `English_Aussie_Bloke`    | 200, MP3                      | Approved in Phase 6A           |
| Canadian   | Female | —                         | Not synthesized               | Unresolved; safely unsupported |
| Canadian   | Male   | —                         | Not synthesized               | Unresolved; safely unsupported |

## Comparable voice auditions

Every configured voice used the same 190-character sample:

> Well, I'd say the best part is that it fits naturally into my routine. It
> isn't complicated, but it helps me slow down, pay attention, and enjoy what
> I'm doing instead of rushing through it.

| Profile         | Voice ID                  | Provider duration | Browser duration |     Usage |   Bytes | Result                      |
| --------------- | ------------------------- | ----------------: | ---------------: | --------: | ------: | --------------------------- |
| British Female  | `English_Graceful_Lady`   |          16.271 s |         16.208 s | 190 chars | 262,068 | MP3 playable                |
| American Female | `English_Whispering_girl` |          15.876 s |         15.824 s | 190 chars | 255,732 | Playable; rejected by owner |
| American Male   | `English_Trustworthy_Man` |          12.420 s |         12.365 s | 190 chars | 200,436 | MP3 playable                |
| Australian Male | `English_Aussie_Bloke`    |           9.324 s |          9.253 s | 190 chars | 150,900 | MP3 playable                |

The substantial duration difference for identical text is a voice-specific
pacing observation that requires listening review. API success is not treated
as voice-quality approval. The American Female row is retained only as a
historical audition result; its active mapping has been removed.

The local-only audition files are stored outside Git in:

```text
C:\Users\A\AppData\Local\Temp\accentforge-phase6b-audio
```

Files:

- `audition-british-female.mp3`
- `audition-american-female.mp3`
- `audition-american-male.mp3`
- `audition-australian-male.mp3`

## Information-rich Part 2 validation

Both cases used the real Kimi `/api/generate` route and then the approved
Australian Male MiniMax voice through `/api/speech`. No hesitation fillers or
new biography were added to extend duration.

### Case 1 — Old camera, Band 7

Structured Chinese:

> 我想介绍一台对我很有意义的旧相机。它是我爸爸大约十年前送给我的，当时我刚开始对摄影感兴趣。相机本身并不昂贵，外形也很普通，机身上甚至有几道使用留下的划痕，但我一直很珍惜它。真正让我喜欢上这台相机，是几年前的一次海边旅行。那天我们为了看日出很早就出门，我用它拍下了天空从深蓝慢慢变成橙色的过程。因为它不像手机那样能马上看到照片，我只能更认真地观察光线和构图。后来冲洗出来的照片并不完美，有几张还有点模糊，但那种等待结果的感觉很特别。现在我平时更多用手机拍照，因为确实方便得多，不过偶尔拿起这台旧相机时，我还是会想起那次旅行，也会提醒自己放慢一点，认真看看眼前的东西。

Generated English:

> I'd like to talk about an old camera that means a lot to me. My dad gave it
> to me about ten years ago, right when I was first getting into photography.
> The camera itself wasn't expensive and it looks pretty ordinary — there are
> even a few scratches on the body from years of use — but I've always treasured
> it. What really made me fall in love with it was a trip to the coast a few
> years back. We'd gone out really early that morning to catch the sunrise, and
> I used it to capture the sky changing from deep blue to orange. Because you
> can't instantly check your shots like you can on a phone, I had to pay much
> closer attention to the light and the composition. When the photos came back
> from being developed, they weren't perfect — a couple were even a bit blurry —
> but there was something really special about that whole process of waiting to
> see how they'd turned out. These days I mostly use my phone for photos since
> it's just so much more convenient, but every now and then when I pick up that
> old camera, I'm taken right back to that morning by the sea. It also reminds me
> to slow down a bit and really look at what's in front of me.

- Word count: 226
- Provider duration: 57.240 seconds
- Browser duration: 57.240 seconds
- Usage: 1,141 characters
- Semantic fidelity: Pass. All substantive people, time, place, events and
  reflections come from the Structured Chinese.
- Sustained Part 2 suitability: The content is coherent and continuous, but at
  this voice's delivered pace it is materially shorter than 1:45–2:00.

### Case 2 — Cooking skill, Band 8

Structured Chinese:

> 我想说的一项实用技能是做饭，尤其是做一碗简单但味道不错的面。以前我几乎不会做饭，忙的时候经常随便点外卖。后来有一个假期，我跟家里人学了最基本的步骤，比如怎么调汤底、什么时候放蔬菜，以及怎样让面条保持合适的口感。刚开始我总是手忙脚乱，有时汤太咸，有时面又煮得太软，但练了几次以后，我慢慢找到了自己的节奏。现在如果学习或工作了一整天，我会给自己做一碗面，加上鸡蛋和冰箱里现有的蔬菜。整个过程可能只有二十分钟，却会让我从紧张的状态里安静下来。这项技能对我有用，不只是因为能省一点钱，也因为我可以根据自己的口味调整，而且偶尔还能做给朋友吃。它并不是什么了不起的本领，但确实让我的日常生活更独立、更舒服。

Generated English:

> The practical skill I'd like to talk about is cooking, or more specifically,
> making a simple but decent bowl of noodles. I used to be pretty hopeless in
> the kitchen — whenever things got busy, I'd just order takeout without
> thinking twice. Then one holiday, I learned the basics from my family: how to
> get the broth right, when to throw in the vegetables, and how to keep the
> noodles at that perfect texture. At first, I was all over the place — sometimes
> the soup would come out way too salty, other times I'd overcook the noodles
> until they were practically mush. But after a few tries, I gradually found my
> own rhythm. These days, if I've had a long day of studying or work, I'll make
> myself a bowl with an egg and whatever vegetables I've got in the fridge. The
> whole thing takes maybe twenty minutes, but it completely shifts me out of
> that tense, wound-up state. What makes this skill genuinely useful for me isn't
> just saving a bit of money — it's that I can adjust everything to my own taste,
> and every now and then I'll cook for a friend too. It's nothing particularly
> impressive, but it's made my day-to-day life feel more independent, more
> comfortable somehow.

- Word count: 213
- Provider duration: 62.892 seconds
- Browser duration: 62.892 seconds
- Usage: 1,171 characters
- Semantic fidelity: Pass. The English reconstructs the supplied content
  naturally without adding substantive biography.
- Sustained Part 2 suitability: The result is coherent and continuous, but the
  delivered duration remains well below 1:45–2:00.

## Part 2 duration refinement

The original English was reused unchanged, so this refinement made no Kimi
request and introduced no filler or new biography. Four short, controlled
MiniMax requests compared speeds `0.52` and `0.53` with the approved Australian
Male voice.

| Speed | Camera duration | Cooking duration |  Average | Assessment                    |
| ----: | --------------: | ---------------: | -------: | ----------------------------- |
|  0.52 |        1:52.392 |         2:02.760 | 1:57.576 | Current provisional candidate |
|  0.53 |        1:43.140 |         1:56.820 | 1:49.980 | Comparison only               |

All four MP3s reached browser media `readyState = 4` and playback started
successfully. The unexpectedly large difference between two generations only
`0.01` apart shows that MiniMax duration also varies with generated prosody and
is not a deterministic inverse function of the configured speed. A single
global speed therefore cannot guarantee exactly 1:55 for every Part 2 answer.

Speed `0.52` is retained as the provisional calibration because its two-case
average is closest to the requested 1:55 target and both cases remain within
approximately eight seconds of it. This needs human listening approval for
naturalness before Phase 6 can be frozen. The English prompts and content were
not changed merely to manufacture duration.

The local comparison files are:

- `speed-0.52-p2-old-camera-band7-australian-male.mp3`
- `speed-0.52-p2-cooking-skill-band8-australian-male.mp3`
- `speed-0.53-p2-old-camera-band7-australian-male.mp3`
- `speed-0.53-p2-cooking-skill-band8-australian-male.mp3`

## Playback and state QA

- All six generated MP3 files loaded in Chrome with media `readyState = 4` and
  `HTMLAudioElement.play()` resolving successfully.
- Selecting Accent or Voice does not synthesize; only Read Aloud calls
  `/api/speech`.
- The browser sends the selected logical Accent and Voice; the Worker centrally
  resolves the corresponding environment-configured Voice ID.
- Five unresolved combinations return normalized HTTP 422 messages and are
  rejected before provider transport.
- Duplicate submissions, stale English protection, audio invalidation and Blob
  URL cleanup remain covered by frontend tests.
- Provider failures and credentials remain hidden.
- No browser SpeechSynthesis fallback exists.

## Request and usage summary

- Voice-list API queries: 2, successful, no synthesis.
- Real MiniMax TTS requests: 10, all successful, no retries.
- Real Kimi English-generation requests: 2, both successful.
- Audition usage: 760 characters.
- Initial Part 2 usage: 2,312 characters.
- Speed-comparison usage: 4,624 characters.
- Total MiniMax usage reported: 7,696 characters.
- Generated audio is local-only and ignored by Git.

## Known limitations and human review

1. American Female, British Male, Australian Female, Canadian Female and Canadian Male remain
   unresolved because the current official system-voice evidence does not
   identify suitable candidates.
2. The tested American Female whispering profile was explicitly rejected. The
   stronger official-site candidate is unavailable in the current Mainland
   system-voice list, so no substitute was guessed.
3. British Female is much slower than Australian Male on the same text;
   naturalness and consistency require human listening.
4. Speed `0.52` brings these two information-rich Part 2 cases close to the
   requested 1:55 target on average, but exact duration varies by content and
   generation and the slower delivery still needs listening approval.
5. Only Australian Male has human listening approval. API success for the other
   candidates is not approval.

Phase 6B should not be frozen until the remaining voice samples and speed `0.52`
Part 2 samples are reviewed, and the five missing regional/gender profiles
receive product-owner direction.
