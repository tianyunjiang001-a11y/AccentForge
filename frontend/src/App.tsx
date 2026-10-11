import { useEffect, useMemo, useRef, useState } from "react";

import { EditorCard } from "./components/EditorCard";
import { SegmentedControl } from "./components/SegmentedControl";
import { PRODUCT_LINKS } from "./config/productLinks";
import {
  GENERATE_ENGLISH_ERROR_MESSAGE,
  generateEnglish,
} from "./services/generateEnglish";
import { POLISH_ERROR_MESSAGE, polishIdea } from "./services/polishIdea";
import {
  AUDIO_ERROR_MESSAGE,
  isPhase6ATestVoice,
  PHASE_6A_UNSUPPORTED_VOICE_MESSAGE,
  synthesizeSpeech,
} from "./services/synthesizeSpeech";
import type { Accent, SpeakingPart, TargetBand, Voice } from "./types";

const partOptions: readonly SpeakingPart[] = ["Part 1", "Part 2", "Part 3"];
const bandOptions: readonly TargetBand[] = ["5", "6", "7", "8", "9"];
const accentOptions: readonly Accent[] = [
  "British",
  "American",
  "Australian",
  "Canadian",
];
const voiceOptions: readonly Voice[] = ["Female", "Male"];

interface GenerationContext {
  band: TargetBand;
  part: SpeakingPart;
}

interface EnglishContext extends GenerationContext {
  structuredChinese: string;
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M6.5 4.8a.9.9 0 0 1 1.4-.75l7.1 5.2a.92.92 0 0 1 0 1.5l-7.1 5.2a.9.9 0 0 1-1.4-.75V4.8Z" />
    </svg>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string | null;
  children: string;
}) {
  if (!href) {
    return <span aria-disabled="true">{children}</span>;
  }

  return (
    <a href={href} rel="noreferrer" target="_blank">
      {children}
    </a>
  );
}

function App() {
  const [part, setPart] = useState<SpeakingPart | null>(null);
  const [band, setBand] = useState<TargetBand | null>(null);
  const [accent, setAccent] = useState<Accent | null>(null);
  const [voice, setVoice] = useState<Voice | null>(null);
  const [chinese, setChinese] = useState("");
  const [english, setEnglish] = useState("");
  const [polishedFor, setPolishedFor] = useState<GenerationContext | null>(
    null,
  );
  const [englishFor, setEnglishFor] = useState<EnglishContext | null>(null);
  const [isPolishing, setIsPolishing] = useState(false);
  const [isGeneratingEnglish, setIsGeneratingEnglish] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [polishError, setPolishError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const polishInFlight = useRef(false);
  const generateInFlight = useRef(false);
  const speechInFlight = useRef(false);

  const isBusy = isPolishing || isGeneratingEnglish || isSynthesizing;
  const hasPolished = polishedFor !== null;
  const isPolishedStale =
    hasPolished && (polishedFor.part !== part || polishedFor.band !== band);
  const isEnglishStale =
    english.length > 0 &&
    (englishFor?.part !== part ||
      englishFor.band !== band ||
      englishFor.structuredChinese !== chinese);
  const canPolish =
    Boolean(part && band && chinese.trim()) && !isBusy && !isPolishing;
  const canGenerateEnglish =
    Boolean(part && band && hasPolished && chinese.trim()) &&
    !isPolishedStale &&
    !isBusy;
  const canChooseVoice = Boolean(english) && !isEnglishStale && !isBusy;
  const canReadAloud = canChooseVoice && Boolean(accent && voice);

  const chineseDescription = useMemo(() => {
    if (polishError) {
      return polishError;
    }

    if (isPolishedStale) {
      return "Speaking Part or Target Band changed. Polish this idea again.";
    }

    if (hasPolished) {
      return "Review or edit the structured Chinese before generating English.";
    }

    return "Start with your thoughts in Chinese. Fragments are fine.";
  }, [hasPolished, isPolishedStale, polishError]);

  const englishDescription = generateError
    ? generateError
    : isEnglishStale
      ? "Your source changed. Generate English again before listening."
      : "Your natural, level-appropriate spoken answer will appear here.";

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  function invalidateAudio() {
    setAudioUrl(null);
  }

  function handlePartChange(nextPart: SpeakingPart) {
    setPart(nextPart);
    setPolishError(null);
    setGenerateError(null);
    setAudioError(null);
    invalidateAudio();
  }

  function handleBandChange(nextBand: TargetBand) {
    setBand(nextBand);
    setPolishError(null);
    setGenerateError(null);
    setAudioError(null);
    invalidateAudio();
  }

  function handleChineseChange(value: string) {
    setChinese(Array.from(value).slice(0, 1000).join(""));
    setPolishError(null);
    setGenerateError(null);
    setAudioError(null);
    invalidateAudio();
  }

  async function handlePolish() {
    if (!part || !band || !canPolish || polishInFlight.current) {
      return;
    }

    polishInFlight.current = true;
    setIsPolishing(true);
    setPolishError(null);
    setAudioError(null);
    invalidateAudio();

    try {
      const structuredChinese = await polishIdea({
        rawChinese: chinese,
        part,
        targetBand: band,
      });

      setChinese(structuredChinese);
      setPolishedFor({ band, part });
      setEnglishFor(null);
      setGenerateError(null);
    } catch {
      setPolishError(POLISH_ERROR_MESSAGE);
    } finally {
      polishInFlight.current = false;
      setIsPolishing(false);
    }
  }

  async function handleGenerateEnglish() {
    if (!part || !band || !canGenerateEnglish || generateInFlight.current) {
      return;
    }

    generateInFlight.current = true;
    setIsGeneratingEnglish(true);
    setGenerateError(null);
    setAudioError(null);
    invalidateAudio();

    try {
      const spokenEnglish = await generateEnglish({
        structuredChinese: chinese,
        part,
        targetBand: band,
      });

      setEnglish(spokenEnglish);
      setEnglishFor({ band, part, structuredChinese: chinese });
    } catch {
      setGenerateError(GENERATE_ENGLISH_ERROR_MESSAGE);
    } finally {
      generateInFlight.current = false;
      setIsGeneratingEnglish(false);
    }
  }

  function handleAccentChange(nextAccent: Accent) {
    setAccent(nextAccent);
    setAudioError(null);
    invalidateAudio();
  }

  function handleVoiceChange(nextVoice: Voice) {
    setVoice(nextVoice);
    setAudioError(null);
    invalidateAudio();
  }

  async function handleReadAloud() {
    if (!accent || !voice || !canReadAloud || speechInFlight.current) {
      return;
    }

    invalidateAudio();

    if (!isPhase6ATestVoice(accent, voice)) {
      setAudioError(PHASE_6A_UNSUPPORTED_VOICE_MESSAGE);
      return;
    }

    speechInFlight.current = true;
    setIsSynthesizing(true);
    setAudioError(null);

    try {
      const result = await synthesizeSpeech({ text: english, accent, voice });
      setAudioUrl(result.audioUrl);
    } catch {
      setAudioError(AUDIO_ERROR_MESSAGE);
    } finally {
      speechInFlight.current = false;
      setIsSynthesizing(false);
    }
  }

  return (
    <div className="app">
      <header className="site-header">
        <p className="product-kicker">AI-powered IELTS Speaking Assistant</p>
        <h1>AccentForge</h1>
        <p className="hero-statement">
          From scattered thoughts to spoken English.
        </p>
      </header>

      <main>
        <section className="setup-controls" aria-label="Answer settings">
          <SegmentedControl
            disabled={isBusy}
            label="Speaking Part"
            onChange={handlePartChange}
            options={partOptions}
            value={part}
          />
          <SegmentedControl
            disabled={isBusy}
            label="Target Band"
            onChange={handleBandChange}
            options={bandOptions}
            value={band}
          />
        </section>

        <section className="workspace" aria-label="Speaking answer workspace">
          <EditorCard
            actionDisabled={!canPolish}
            actionLabel={
              isPolishing ? "Polishing your idea…" : "Polish My Idea"
            }
            actionLoading={isPolishing}
            count={`${Array.from(chinese).length} / 1000`}
            description={chineseDescription}
            id="chinese-idea"
            label="What I Want to Say"
            onAction={handlePolish}
            onChange={handleChineseChange}
            placeholder="用中文写下你的想法……"
            status={isPolishedStale ? "Update needed" : undefined}
            textareaReadOnly={isBusy}
            value={chinese}
          />

          <EditorCard
            actionDisabled={!canGenerateEnglish}
            actionLabel={
              isGeneratingEnglish
                ? "Generating your answer…"
                : "Generate English"
            }
            actionLoading={isGeneratingEnglish}
            description={englishDescription}
            id="english-version"
            label="IELTS Speaking Version"
            onAction={handleGenerateEnglish}
            placeholder="Your IELTS Speaking version will appear here."
            readOnly
            status={isEnglishStale ? "Update needed" : undefined}
            value={english}
          />
        </section>

        <section className="voice-panel" aria-labelledby="voice-heading">
          <div className="voice-panel__heading">
            <h2 id="voice-heading">Listen and practise</h2>
            <p>Choose the voice you would like to shadow.</p>
          </div>

          <div className="voice-controls">
            <SegmentedControl
              disabled={!canChooseVoice}
              label="Accent"
              onChange={handleAccentChange}
              options={accentOptions}
              value={accent}
            />
            <SegmentedControl
              disabled={!canChooseVoice}
              label="Voice"
              onChange={handleVoiceChange}
              options={voiceOptions}
              value={voice}
            />
            <button
              className="primary-button read-button"
              disabled={!canReadAloud}
              onClick={handleReadAloud}
              type="button"
            >
              {isSynthesizing ? (
                <span aria-hidden="true" className="spinner" />
              ) : (
                <PlayIcon />
              )}
              {isSynthesizing ? "Generating audio…" : "Read Aloud"}
            </button>
          </div>

          {audioError ? (
            <p className="voice-feedback" role="alert">
              {audioError}
            </p>
          ) : null}

          {audioUrl && accent && voice ? (
            <div className="audio-result" aria-live="polite">
              <div>
                <p className="audio-result__title">
                  {accent} · {voice}
                </p>
                <p className="audio-result__note">
                  Ready for listening and shadowing.
                </p>
              </div>
              <audio autoPlay controls controlsList="nodownload" src={audioUrl}>
                Your browser does not support audio playback.
              </audio>
            </div>
          ) : null}
        </section>
      </main>

      <footer className="site-footer">
        <p>
          AccentForge is an independent educational tool for IELTS Speaking
          practice. Target Band settings guide language complexity and style;
          they do not predict or guarantee an IELTS score. IELTS is a registered
          trademark of its respective owners. AccentForge is not affiliated with
          or endorsed by IELTS.
        </p>
        <nav aria-label="Footer links">
          <FooterLink href={PRODUCT_LINKS.github}>GitHub</FooterLink>
          <span aria-hidden="true">·</span>
          <FooterLink href={PRODUCT_LINKS.contact}>Contact</FooterLink>
        </nav>
      </footer>
    </div>
  );
}

export default App;
