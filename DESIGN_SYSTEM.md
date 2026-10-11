# AccentForge — Design System

**Version:** 1.1
**Status:** Frozen Visual Direction  
**Design Direction:** Apple-inspired, minimal, premium, calm

---

# 1. Overall Visual Principle

AccentForge should feel:

- premium;
- calm;
- intelligent;
- spacious;
- modern;
- highly legible;
- understated rather than decorative.

The interface should be inspired by the visual restraint of Apple products and Apple software.

Do not imitate Apple branding directly.

The goal is not to copy Apple.

The goal is to reproduce the qualities of:

**clarity + hierarchy + whitespace + restraint + confidence**

---

# 2. Core Design Rule

The interface must never look like:

- a generic AI chatbot;
- a SaaS dashboard;
- a student coding assignment;
- a colourful education website;
- a gaming interface;
- a startup landing page full of gradients;
- a Bootstrap template.

AccentForge should feel closer to:

> a polished native productivity tool

than:

> a marketing website.

---

# 3. Colour System

Use only three primary visual colours.

## Colour 1 — Warm Off-White

Primary page background:

```text
#F5F5F7
```

This should replace pure white as the dominant background.

It creates a softer, more premium visual tone.

---

## Colour 2 — Deep Graphite

Primary text and dark UI elements:

```text
#1D1D1F
```

Use for:

- headings;
- primary text;
- selected states;
- main CTA when appropriate.

Avoid pure black.

---

## Colour 3 — Muted Blue

Accent colour:

```text
#5B6F8F
```

This colour should feel:

- restrained;
- slightly desaturated;
- professional;
- calm.

Use sparingly for:

- active selections;
- focus states;
- subtle highlights;
- links;
- progress indicators.

Do not use bright electric blue.

---

# 4. Secondary Tones

Secondary shades may be created only through opacity or lighter tonal variations of the three core colours.

Examples:

- graphite at 60% opacity;
- blue at 10% background tint;
- off-white slightly darker for borders.

Do not introduce additional unrelated colours.

No red, green, orange, purple or rainbow states unless required for critical system feedback.

---

# 5. Background

Main background:

```text
#F5F5F7
```

Main work area may use:

```text
#FFFFFF
```

only as a surface/card colour.

The entire website should not be pure white.

The contrast between:

> soft grey page background

and:

> clean white content surfaces

should create depth.

---

# 6. Typography

Use a system-first sans-serif stack.

Recommended:

```css
font-family:
  -apple-system,
  BlinkMacSystemFont,
  "SF Pro Display",
  "SF Pro Text",
  "Helvetica Neue",
  Arial,
  sans-serif;
```

Do not bundle proprietary Apple fonts.

Use native system fonts where available.

---

# 7. Typography Hierarchy

## Product Name

Large but restrained.

Recommended:

```text
40–48px desktop
32–36px mobile
```

Weight:

```text
600
```

---

## Hero Statement

Example:

> From scattered thoughts to spoken English.

Recommended:

```text
24–30px
```

Weight:

```text
500
```

Colour:

graphite with slightly reduced opacity.

---

## Section Labels

Examples:

- Speaking Part
- Target Band
- What I Want to Say
- IELTS Speaking Version
- Accent
- Voice

Recommended:

```text
14–16px
```

Weight:

```text
500–600
```

Avoid excessive uppercase.

---

## Main Body Text

Recommended:

```text
16–18px
```

Line height:

```text
1.5–1.65
```

The text editors should feel comfortable for long reading.

---

# 8. Page Width

The interface should not stretch edge-to-edge.

Recommended maximum content width:

```text
1180–1240px
```

Desktop page should have generous side margins.

The main experience should remain centred.

---

# 9. Spacing

Whitespace is a core part of the design.

Use generous spacing between major sections.

Recommended vertical spacing:

```text
64–96px
```

between large page sections.

Inside cards:

```text
24–32px
```

Avoid cramped controls.

---

# 10. Header

Keep the top area extremely simple.

Recommended structure:

```text
AccentForge

From scattered thoughts to spoken English.

AI-powered IELTS Speaking Assistant
```

Do not add:

- navigation menus;
- About;
- Pricing;
- Blog;
- Features;
- account buttons;
- decorative icons.

This is a tool, not a corporate homepage.

---

# 11. Main Workspace

Desktop:

Use a two-column layout.

```text
┌─────────────────────┬─────────────────────┐
│                     │                     │
│ What I Want to Say  │ IELTS Speaking      │
│                     │ Version             │
│                     │                     │
│ Chinese             │ English             │
│                     │                     │
└─────────────────────┴─────────────────────┘
```

Both panels should have equal visual importance.

Recommended gap:

```text
20–24px
```

On mobile:

Stack vertically.

---

# 12. Editor Cards

Each editor should use:

Background:

```text
#FFFFFF
```

Border:

very subtle light graphite/grey.

Recommended:

```text
1px solid rgba(29, 29, 31, 0.08)
```

Border radius:

```text
20–24px
```

Shadow:

extremely subtle.

Example:

```text
0 8px 30px rgba(0,0,0,0.04)
```

Avoid obvious floating-card effects.

---

# 13. Text Areas

Text areas should feel integrated into the card rather than inserted as default HTML form controls.

Avoid:

- dark rectangular borders;
- browser-default textarea styles;
- bright focus outlines.

Use:

- transparent or white background;
- generous padding;
- soft focus state;
- no unnecessary inner borders.

Character counter:

small, understated, bottom-right.

---

# 14. Segmented Controls

Speaking Part, Target Band, Accent and Voice should use Apple-like segmented controls.

Example:

```text
┌────────────────────────────┐
│ Part 1 │ Part 2 │ Part 3   │
└────────────────────────────┘
```

Unselected:

soft neutral background.

Selected:

deep graphite or muted blue.

Do not use four unrelated coloured buttons.

Recommended border radius:

```text
12–16px
```

Transitions:

```text
150–200ms
```

Subtle only.

---

# 15. Primary Buttons

Primary actions:

- Polish My Idea
- Generate English
- Read Aloud

Buttons should be prominent but not oversized.

Recommended:

Background:

```text
#1D1D1F
```

Text:

```text
#FFFFFF
```

Hover:

slightly lighter graphite.

Border radius:

```text
14–16px
```

Height:

```text
48–52px
```

Avoid gradients.

---

# 16. Secondary Accent

Muted blue:

```text
#5B6F8F
```

Use for:

- active secondary controls;
- subtle focus state;
- text links;
- small indicators.

Do not make every CTA blue.

Graphite should remain the dominant action colour.

---

# 17. Icons

Use icons only when they add clear meaning.

Examples:

- play;
- audio;
- regenerate if ever needed;
- external GitHub link.

Icons should be:

- monochrome;
- simple;
- line-based;
- visually lightweight.

Do not use emojis in the final interface.

Replace:

```text
✨ Polish My Idea
```

with:

```text
Polish My Idea
```

or use a restrained icon if needed.

---

# 18. Motion

Use minimal motion.

Allowed:

- subtle fade;
- short opacity transitions;
- segmented-control movement;
- soft loading states.

Avoid:

- bouncing;
- glowing;
- parallax;
- particle effects;
- animated gradients;
- excessive hover movement.

---

# 19. Loading States

Loading should feel calm.

Example:

```text
Polishing your idea…
```

or:

```text
Generating your answer…
```

Use:

- subtle spinner;
- understated progress indication.

Do not use playful AI animations.

---

# 20. Voice Section

Voice settings should appear only after or near the English output.

Structure:

```text
Accent
[ British ] [ American ] [ Australian ]

Voice
[ approved option(s) for the selected Accent ]

[ ▶ Read Aloud ]
```

Keep this section visually quieter than the two main editors.

The text transformation remains the core experience.

For the reduced V1 voice set, the linked controls expose exactly these
profiles:

- British Female;
- American Female;
- American Male;
- Australian Male.

Do not show disabled or unavailable regional/gender combinations. When Accent
changes, preserve the current Voice only if that combination is approved;
otherwise clear the Voice selection. This availability behaviour must not add
new colours, explanatory badges or visual clutter.

---

# 21. Footer

Footer should be minimal.

Include only:

- GitHub;
- contact;
- educational disclaimer.

Example:

```text
AccentForge is an independent educational tool for IELTS Speaking practice.

GitHub · Contact
```

No oversized footer navigation.

---

# 22. Responsive Behaviour

Desktop:

Two-column workspace.

Tablet:

Two columns if comfortable; otherwise stack.

Mobile:

Single-column sequence:

```text
Part
Band
Chinese
Polish
English
Accent
Voice
Read Aloud
```

Mobile should feel intentionally designed rather than compressed desktop UI.

---

# 23. Accessibility

Maintain readable contrast.

Do not rely only on colour to indicate selected states.

Use:

- colour;
- shape;
- weight;
- background contrast

together.

Interactive controls should have adequate touch targets.

---

# 24. Visual Density

Prefer fewer elements with more breathing room.

If unsure whether an element is necessary:

remove it.

Avoid instructional paragraphs inside the main workspace.

The interface should be understandable through layout and labels.

---

# 25. Forbidden Visual Patterns

Do NOT use:

- rainbow gradients;
- neon colours;
- purple AI gradients;
- glassmorphism everywhere;
- excessive blur;
- huge shadows;
- colourful cards;
- illustrated mascots;
- stock photography;
- large decorative blobs;
- AI robot icons;
- emoji-heavy controls;
- overly rounded cartoon UI;
- dashboard-style sidebars;
- dense settings panels.

---

# 26. Desired First Impression

Within five seconds, the user should feel:

> This is simple.

Within ten seconds:

> I know exactly where to type.

Within thirty seconds:

> This feels polished and trustworthy.

The visual design should communicate confidence through restraint.
