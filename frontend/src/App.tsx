import { useState } from "react";

import { EditorCard } from "./components/EditorCard";
import { SegmentedControl } from "./components/SegmentedControl";
import { PRODUCT_LINKS } from "./config/productLinks";
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
  const [idea, setIdea] = useState("");

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
            label="Speaking Part"
            onChange={setPart}
            options={partOptions}
            value={part}
          />
          <SegmentedControl
            label="Target Band"
            onChange={setBand}
            options={bandOptions}
            value={band}
          />
        </section>

        <section className="workspace" aria-label="Speaking answer workspace">
          <EditorCard
            actionLabel="Polish My Idea"
            count={`${idea.length} / 1000`}
            description="Start with your thoughts in Chinese. Fragments are fine."
            id="chinese-idea"
            label="What I Want to Say"
            onChange={setIdea}
            placeholder="用中文写下你的想法……"
            value={idea}
          />

          <EditorCard
            actionLabel="Generate English"
            description="Your natural, level-appropriate spoken answer will appear here."
            id="english-version"
            label="IELTS Speaking Version"
            placeholder="Your IELTS Speaking version will appear here."
            readOnly
            value=""
          />
        </section>

        <section className="voice-panel" aria-labelledby="voice-heading">
          <div className="voice-panel__heading">
            <h2 id="voice-heading">Listen and practise</h2>
            <p>Choose the voice you would like to shadow.</p>
          </div>

          <div className="voice-controls">
            <SegmentedControl
              label="Accent"
              onChange={setAccent}
              options={accentOptions}
              value={accent}
            />
            <SegmentedControl
              label="Voice"
              onChange={setVoice}
              options={voiceOptions}
              value={voice}
            />
            <button className="primary-button read-button" type="button">
              <PlayIcon />
              Read Aloud
            </button>
          </div>
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
