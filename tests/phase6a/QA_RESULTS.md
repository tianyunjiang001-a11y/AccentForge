# AccentForge Phase 6A — Single-Voice QA Results

**Evaluation date:** 2026-10-12 (Asia/Shanghai)  
**Model:** `speech-2.8-turbo`  
**Voice ID:** `English_Aussie_Bloke`  
**Logical selection:** Australian · Male

## Scope

Phase 6A enables exactly one provisional development voice. The other seven
Accent × Voice combinations remain unconfigured and are rejected before any
paid provider request.

The Phase 4–5 Kimi workflows, frozen English prompts, Semantic Lock, speaking
style specification and approved visual system were not changed.

## Official API pattern

The implementation follows the current MiniMax China Mainland documentation:

- `POST https://api.minimax.cn/v1/t2a_v2`;
- Bearer API Key authentication;
- non-streaming response;
- English language boost;
- speed `1.0`;
- MP3, 32 kHz, 128 kbps, mono;
- hex audio response;
- HTTP success plus `base_resp.status_code === 0` and `data.status === 2`;
- defensive hex decoding into normalized MP3 bytes.

`MINIMAX_BASE_URL` is interpreted as a base URL. The provider appends
`/v1/t2a_v2` once and also accepts a configuration that already contains the
complete endpoint without duplicating the path.

## Real request results

Two real requests were made, both using the Australian male test voice. No
other paid MiniMax API or voice was called.

### Request 1 — Worker and MP3 verification

The text was the short, non-private Part 1 coffee output from the Phase 5 QA
set.

| Result                     |                 Value |
| -------------------------- | --------------------: |
| HTTP status                |                   200 |
| Content type               |          `audio/mpeg` |
| File size                  |         160,116 bytes |
| Provider audio length      |              9,900 ms |
| Provider billed characters |                   188 |
| MP3 prefix                 | `49 44 33 04` (`ID3`) |

The generated file was written only to the operating-system temporary folder
for playback verification. It is not tracked or stored in the repository.

### Request 2 — browser request path

A shorter coffee sentence was requested through Chrome's browser fetch/Blob
path. `/api/speech` returned HTTP 200. The result was not committed.

## Browser playback verification

The MP3 from Request 1 was served from a local-only playback fixture without a
further provider call. Headless Chrome:

- loaded the MP3 metadata;
- decoded the media to `readyState=4`;
- resolved `HTMLAudioElement.play()` successfully;
- reported a browser media duration of `9.845281` seconds.

The small difference from the provider's 9.9-second metadata is expected
container/measurement rounding. Human listening is still required to approve
voice naturalness, accent quality and shadowing suitability.

## Automated coverage

Worker tests cover:

- request validation and the provider text limit;
- exact accent and voice values;
- only the configured voice reaching the provider;
- official request fields;
- base URL endpoint de-duplication;
- HTTP and business-status errors;
- malformed, incomplete and non-MP3 responses;
- hex decoding;
- normalized MP3 response headers;
- provider-error secrecy.

Frontend tests cover:

- `/api/speech` receiving the latest non-stale English;
- Australian · Male mapping;
- restrained loading state;
- duplicate-request prevention;
- unsupported-combination local messaging with no request;
- API failure handling;
- audio invalidation when source or voice settings change;
- preservation of the existing Kimi Polish and Generate flows.

## Human review required

Listen to the provisional Australian male voice and decide whether it is:

- recognizably but non-stereotypically Australian;
- natural and conversational;
- moderately paced;
- clear enough for IELTS shadowing;
- suitable to retain when Phase 6B evaluates the complete voice set.

Phase 6B must not begin until this listening review is approved.
