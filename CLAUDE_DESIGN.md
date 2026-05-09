# ManimAI — Design Brief

This document is the sole input a design agent should need to redesign the ManimAI frontend without reading any other file. It documents what exists, what must not change, and what the redesign should aim to feel like.

---

## SECTION 1 — Product Purpose and User Flow

**What ManimAI does.** ManimAI takes a screenshot of a mathematical concept (a textbook page, a definition, a formula) and produces a short rendered video animation that visually explains the concept in the style of 3Blue1Brown. It uses Claude to read the screenshot and generate a Manim Python script, runs that script server-side to produce an MP4, and surfaces a confidence score plus a verified textbook link alongside the result. Users can ask follow-up questions and get short clarification animations rendered on demand.

**Complete user flow:**

1. **Landing — UploadScreen.** User arrives at `/`. Sees the product name "ManimAI", a one-sentence pitch, and an empty drop zone. There is no other content on the page.
2. **File selection.** User clicks the drop zone, picks an image from their file picker, and the drop zone replaces the upload icon with a thumbnail preview of the selected screenshot. A "Generate Animation" submit button now appears below the drop zone.
3. **Generation in progress (still on UploadScreen).** User clicks "Generate Animation". The submit button disappears and is replaced by an inline status line "Analyzing your screenshot and generating Manim code..." (currently using `animate-pulse`). The full call takes roughly 25–45 seconds (Claude vision call + a second Claude review call + a Tavily search).
4. **Transition to ResultScreen.** As soon as `/api/generate` returns successfully, the page state flips from `'upload'` to `'result'` and the UploadScreen unmounts. There is no transitional animation.
5. **ResultScreen — initial paint.** User sees: the generated Manim Python source on the left, and on the right a placeholder video panel with the text "Rendering animation…" (animate-pulse), the confidence score widget, the textbook source card, and a follow-up question input.
6. **Background render of the original video.** ResultScreen mounts and immediately POSTs to `/api/render` with the generated code. This call takes 30–90 seconds. While it runs, the right-column video panel stays in its "Rendering animation…" state. When it returns, the panel swaps the placeholder for an autoplaying muted `<video>` element.
7. **Optional clarification loop.** User types a follow-up question (e.g. "explain the limit step in more detail") and clicks "Explain" (or presses Enter). The button label changes to "Rendering…", `/api/clarify` is called to get a new short Manim script, then `/api/render` is called to render it. Both calls together take 40–80 seconds. On success, a new "Clarification N" block is appended below the main grid containing the question text, the clarification's source code, and an autoplaying video. Multiple clarifications stack vertically; previous clarifications are never replaced.
8. **Reset.** User clicks "Try Another" at the bottom of the page. All state is cleared and the app returns to UploadScreen.

There are exactly two top-level screens (`'upload'` and `'result'`) controlled by a single state variable. There are no routes — everything is one page.

---

## SECTION 2 — File Structure and Component Map

### Files relevant to the frontend

- `src/app/layout.tsx` — Root layout. Loads Geist Sans and Geist Mono via `next/font/google` and exposes them as CSS variables `--font-geist-sans` and `--font-geist-mono`. Sets metadata (currently the unedited Next.js default "Create Next App"). Wraps `<body>` in `min-h-full flex flex-col`.
- `src/app/globals.css` — Tailwind v4 entry. Imports `tailwindcss`, defines `--background` and `--foreground` CSS variables (light + `prefers-color-scheme: dark` overrides), registers them via `@theme inline`. **Note: body declares `font-family: Arial, Helvetica, sans-serif` and never uses the Geist variables loaded in layout.tsx — this is an inconsistency the redesign should resolve.**
- `src/app/page.tsx` — Top-level state machine. Owns all post-generation state and decides whether to show UploadScreen or ResultScreen.
- `src/app/components/UploadScreen.tsx` — Landing/upload UI. Owns file selection, preview, and the generate request.
- `src/app/components/ResultScreen.tsx` — Result UI. Contains two inline sub-components (`ConfidenceWidget`, `SourceCard`), owns the original video render trigger, the clarification loop, and the follow-up input.
- `public/animations/continuity.mp4`, `public/animations/differentiability.mp4` — Pre-rendered fallback videos used by `getVideoSrc()` if a live render fails. Keyword-matched on the manim code text.
- `public/rendered/<uuid>.mp4` — Live-rendered videos generated at runtime; written by `/api/render`. Cleaned up after 1 hour.
- `package.json` — Dependencies. **Only Anthropic SDK is installed; no animation, motion, icon, or component libraries.**
- `postcss.config.mjs`, `next.config.ts` — Build tooling, not styling-relevant.
- `prompt.txt` (project root) — System prompt for Claude. Backend-only; mentioned only because the redesign should not assume any UI text matches the prompt.

There is no `tailwind.config.ts`. Tailwind v4 is configured entirely through CSS in `globals.css`.

### Component tree and prop flow

```
RootLayout (layout.tsx)
└── Home (page.tsx)
    └── UploadScreen (when state === 'upload')
    │   props:
    │     onResult: (
    │       manim_code: string,
    │       explanation: string,
    │       confidence_score: number | null,
    │       confidence_reason: string,
    │       confidence_flag: boolean,
    │       concept_name: string | null,
    │       resource_url: string | null,
    │       resource_title: string | null,
    │     ) => void
    │
    └── ResultScreen (when state === 'result')
        props:
          manim_code: string
          explanation: string
          confidenceScore: number | null
          confidenceReason: string
          confidenceFlag: boolean
          conceptName: string | null
          resourceUrl: string | null
          resourceTitle: string | null
          onReset: () => void
        ├── ConfidenceWidget (inline component)
        │   props:
        │     confidenceScore: number | null
        │     confidenceReason: string
        │     confidenceFlag: boolean   ← currently passed but unused
        └── SourceCard (inline component)
            props:
              conceptName: string | null
              resourceUrl: string | null
              resourceTitle: string | null
```

`ConfidenceWidget` and `SourceCard` are currently defined as inline functions in the same file as `ResultScreen`. The redesign may extract them into separate files.

---

## SECTION 3 — Current Design Inventory

### Color palette (Tailwind class names actually used)

- **Background, page-level**: `bg-zinc-950` (`#09090b`)
- **Background, surfaces / panels**: `bg-zinc-900` (`#18181b`)
- **Background, secondary surfaces (inputs)**: `bg-zinc-800` (`#27272a`)
- **Background, source card**: `bg-slate-800/60` (`#1e293b` at 60% opacity) — the only `slate` use in the codebase, inconsistent with the rest
- **Borders**: `border-zinc-700` (`#3f3f46`), `border-zinc-800`
- **Body text, primary**: `text-white`
- **Body text, secondary**: `text-zinc-300`, `text-zinc-400`, `text-zinc-500`
- **Code text (in `<pre>`)**: `text-green-300` (`#86efac`)
- **Primary action / link accent**: `bg-blue-600` (button), `bg-blue-500` (hover), `text-blue-400` (link), `border-blue-500` (source card accent), `bg-blue-900` / `text-blue-300` (clarification chip)
- **Confidence color encoding**: `bg-red-400` / `text-red-400` for score 1–2, `bg-yellow-400` / `text-yellow-400` for score 3, `bg-green-400` / `text-green-400` for score 4–5
- **Error**: `bg-red-950` background, `border-red-800`, `text-red-300`, `text-red-400` for inline error

There are no defined design tokens beyond `--background` and `--foreground` in CSS, and those are unused by any component (every component sets its own backgrounds via Tailwind classes).

### Fonts

- **Loaded**: Geist Sans and Geist Mono via `next/font/google`, exposed as `--font-geist-sans` and `--font-geist-mono`.
- **Actually rendered**: `Arial, Helvetica, sans-serif` (declared in `globals.css` body rule, which overrides any class-based font assignment).
- **Monospace blocks**: `<pre>` elements use `font-mono` Tailwind class, which falls back to the default mono stack since `--font-geist-mono` is also not wired into `font-mono`.

The redesign should pick a typography direction and actually wire it through `globals.css` and/or `@theme`.

### Type scale (current)

- App title: `text-5xl font-bold tracking-tight` (≈48px)
- Section headings: `text-xl font-semibold`
- Pitch / paragraph: `text-lg`
- Body / labels: `text-sm`, `text-xs`
- All sizes are `font-normal` or `font-semibold`/`font-bold`. There is no use of `font-medium` for body, no italic except confidence reason and clarification questions.

### Layout per screen (current spatial structure)

**UploadScreen:**
- Full-viewport (`min-h-screen`) flex container, content vertically + horizontally centered.
- Single column, `max-w-xl`, `gap-8` between sections.
- Order top-to-bottom: title block (centered), drop zone (full width, dashed border, square aspect-ish), conditional submit button (full width), conditional loading text, conditional error block.

**ResultScreen:**
- `min-h-screen flex flex-col px-6 py-10 gap-8`.
- Section 1: a `grid grid-cols-1 md:grid-cols-2 gap-6` two-column layout.
  - Left column: heading, one-sentence description, then a `<pre>` taking the rest of the column up to `max-h-[70vh]`.
  - Right column (top to bottom): heading, one-sentence description, video panel (`min-h-64`), `ConfidenceWidget`, `SourceCard`, follow-up input row.
- Section 2 (only when there is at least one clarification): heading + a list. Each item has a chip + question line on top, then its own internal `grid grid-cols-1 md:grid-cols-2` containing code (`<pre>`) on the left and video on the right.
- Section 3: centered "Try Another" button.

### Component states currently styled

- **UploadScreen idle**: drop zone shows centered icon + "Click to upload an image" caption. Border `zinc-700`, hover transitions to `zinc-500` over default duration.
- **UploadScreen file-selected**: drop zone replaces icon with image preview (`max-h-64 rounded-xl object-contain`).
- **UploadScreen loading**: submit button hidden; `animate-pulse` text replaces it.
- **UploadScreen error**: red panel below the column, `bg-red-950 border border-red-800 text-red-300`.
- **ResultScreen video rendering**: panel shows centered "Rendering animation…" text with `animate-pulse`, `text-zinc-400 text-sm`.
- **ResultScreen video failed**: panel shows "Video unavailable" text in `text-zinc-500`.
- **Confidence widget**: always rendered when score is non-null. Popup is keyboard-inaccessible (no focus trap, no escape key) and is dismissed by clicking a `fixed inset-0` transparent overlay.
- **Clarification button states**: idle "Explain", loading "Rendering…", disabled when input empty (uses `disabled:opacity-40 disabled:cursor-not-allowed`).

### Animations and transitions currently present

- `transition-colors` on hover for: drop zone border, generate button, follow-up button, link, info button, "Try Another".
- `animate-pulse` on the two loading text strings.
- Nothing else. No page transitions, no entrance animations, no skeleton states (just text), no motion when clarifications are appended.

### globals.css definitions

- `--background: #ffffff;` (light), overridden to `#0a0a0a` under `prefers-color-scheme: dark`.
- `--foreground: #171717;` (light), overridden to `#ededed` under dark.
- `@theme inline` registers `--color-background`, `--color-foreground`, `--font-sans`, `--font-mono`.
- Body sets `background: var(--background)` and `color: var(--foreground)` — but every screen overrides this with `bg-zinc-950` so the variable system is effectively dead code.
- Body also sets `font-family: Arial, Helvetica, sans-serif` which overrides the Geist setup.

---

## SECTION 4 — Data and State Map

### State owned by `Home` (page.tsx)

| State | Type | Triggers | Visually controls |
|---|---|---|---|
| `state` | `'upload' \| 'result'` | `handleResult()` → `'result'`, `handleReset()` → `'upload'` | Which top-level screen renders |
| `manimCode` | `string` | Set by `handleResult` from API response | Code panel text on ResultScreen, also passed to `/api/render` and `/api/clarify` |
| `explanation` | `string` | Set by `handleResult` | Passed to `/api/clarify`. Currently never displayed in the UI directly. |
| `confidenceScore` | `number \| null` | Set by `handleResult` | Drives ConfidenceWidget render and color tier |
| `confidenceReason` | `string` | Set by `handleResult` | Reason text inside ConfidenceWidget |
| `confidenceFlag` | `boolean` | Set by `handleResult` | Currently passed but unused inside ConfidenceWidget — color is derived from score, not flag |
| `conceptName` | `string \| null` | Set by `handleResult` | Drives SourceCard render and headline text |
| `resourceUrl` | `string \| null` | Set by `handleResult` | Whether SourceCard shows a link or "no reference" line |
| `resourceTitle` | `string \| null` | Set by `handleResult` | Link label inside SourceCard |

### State owned by `UploadScreen`

| State | Type | Triggers | Visually controls |
|---|---|---|---|
| `selectedFile` | `File \| null` | File input change | Whether submit button is shown |
| `preview` | `string \| null` (object URL) | File input change | Whether the drop zone shows the upload icon or the image preview |
| `loading` | `boolean` | True during `/api/generate` request | Hides submit button, shows pulsing status text |
| `error` | `string \| null` | Set on fetch failure or `data.error` | Shows red error panel |
| `inputRef` | `RefObject<HTMLInputElement>` | — | Programmatically opens file picker on drop-zone click |

### State owned by `ResultScreen`

| State | Type | Triggers | Visually controls |
|---|---|---|---|
| `originalVideoUrl` | `string \| null` | Set after `/api/render` resolves; falls back to `getVideoSrc(manim_code)` on failure | `src` and `key` of the main `<video>` |
| `originalVideoRendering` | `boolean` | True while initial `/api/render` is in flight | Shows "Rendering animation…" placeholder vs. the video |
| `clarifications` | `{ question: string; manim_code: string; video_url: string }[]` | Appended to on each successful clarify+render | Renders the clarifications list section |
| `followUp` | `string` | Input controlled state | Input value |
| `clarifyLoading` | `boolean` | True during clarify+render pipeline | Disables input and button, button label becomes "Rendering…" |
| `clarifyError` | `string \| null` | Set on clarify or render failure | Renders red error text below input |

### State owned by `ConfidenceWidget`

| State | Type | Triggers | Visually controls |
|---|---|---|---|
| `popupOpen` | `boolean` | Info button click (true), close button or overlay click (false) | Whether the explanation popup is rendered |

### `/api/generate` response shape

```ts
// success:
{
  manim_code: string;          // full Python source of the GeneratedScene
  explanation: string;          // value extracted from the "# CONCEPT: ..." line
  confidence_score: number | null;   // integer 1–5, or null if review parse failed
  confidence_reason: string;    // one sentence; defaults to "Confidence check unavailable"
  confidence_flag: boolean;     // true when score ≤ 3
  concept_name: string | null;  // canonical academic term, e.g. "epsilon-delta definition of continuity"
  resource_url: string | null;  // Tavily-found URL
  resource_title: string | null;// Tavily-found page title
}

// failure:
{ error: string }    // status 400 or 500
```

### Other endpoints the frontend calls

- `POST /api/render` body `{ manim_code, scene_name }` → `{ video_url: string }` or `{ error: string }`. Used both for the initial generate result video and for each clarification.
- `POST /api/clarify` body `{ manim_code, explanation, question }` → `{ manim_code: string }` or `{ error: string }`.

---

## SECTION 5 — Constraints for the Redesign

**Files that must not be touched:**
- `src/app/api/generate/route.ts`
- `src/app/api/clarify/route.ts`
- `src/app/api/render/route.ts`
- `prompt.txt`
- `next.config.ts`, `postcss.config.mjs`
- Anything under `node_modules`

**Prop interfaces that must not change without breaking the pipeline:**
- `UploadScreenProps.onResult` — exact 8-positional-parameter signature listed in Section 2. `page.tsx` calls it with that signature.
- `ResultScreenProps` — 9 named props with the exact names and types in Section 2 (note `manim_code` is snake_case while everything else is camelCase; this is a pre-existing inconsistency, but renaming requires a corresponding edit in `page.tsx`).
- `onReset: () => void` — must remain a no-arg callback that triggers `handleReset()` in `page.tsx`.

**Class names or IDs referenced by logic:** None. No selectors are used by JavaScript. All interactivity is via React event handlers, refs, and controlled state. Class names are purely for styling. The redesign is free to rename every Tailwind class.

However, three structural elements have logic semantics that must survive:
1. `<input ref={inputRef} type="file" accept="image/*" />` — must remain an `<input type="file">` accepting images. The drop zone calls `inputRef.current?.click()`.
2. `<video>` elements — must keep `src`, `key`, and `controls` attributes. The `key` prop is a deliberate cache-bust for browser stream caching; removing it reintroduces a known bug.
3. The follow-up input has an `onKeyDown` handler that submits on Enter. This must be preserved.

**Accessibility requirements (current state):**
- The info button has `aria-label="How this score is calculated"`.
- Otherwise no explicit a11y attributes. The popup is not a real `<dialog>` and is not focus-trapped. Buttons lack `aria-pressed` / `aria-busy`. The redesign should improve, not regress, this baseline. Minimum requirement: every interactive control must be reachable by keyboard and have an accessible name.

**Tailwind version and config:**
- Tailwind v4 (`tailwindcss: ^4`, `@tailwindcss/postcss: ^4`).
- No `tailwind.config.ts`. All theme extension happens via `@theme inline { ... }` in `globals.css`.
- The redesign may add tokens to `@theme inline` (e.g. extra colors, spacing, typography) but should not introduce a JS-based config — this version uses the CSS-first system.

**Libraries already installed and usable:**
- `@anthropic-ai/sdk` (server-only, irrelevant to UI).
- `next` 16.2.6, `react` 19.2.4, `react-dom` 19.2.4.
- `next/font/google` is available — Geist Sans and Geist Mono are already loaded; using them only requires fixing `globals.css`.
- **No animation library** (no Framer Motion, no Motion One, no GSAP).
- **No icon library** (no lucide-react, no heroicons, no react-icons). Current code uses inline SVG and unicode characters (`ⓘ`, `→`, `×`).
- **No component library** (no shadcn, no Radix, no Headless UI).

The redesign agent **may** add one or more of these as new dependencies if motivated, but should justify each addition. Note that any animation library should support React 19. CSS-only motion (transitions, keyframes via `@keyframes` in globals.css, view transitions API) is encouraged for a hackathon-grade project.

**Browser targets:** Modern evergreen only (Chrome/Safari/Firefox latest). No IE/legacy considerations.

**Rendering model:** App Router. `page.tsx` and both component files are `'use client'`. The redesign must preserve client-component semantics for any file that uses `useState`/`useEffect`/event handlers.

---

## SECTION 6 — Design Intention and Aesthetic Direction

**Who uses this.** Calculus students, math learners, curious people, and educators. They are reaching for ManimAI because they hit a definition or formula they cannot picture, and they want to *see* what it means before they trust an explanation. They are visual learners by self-selection. Many of them know 3Blue1Brown by name and have a strong aesthetic association with that channel: deep navy backgrounds, hand-tuned color accents, mathematical typesetting, generous whitespace, and motion that reveals structure rather than decorates.

**Emotional tone.** Rigorous but approachable. Quiet confidence. The interface should feel like the kind of tool a serious tutor would use — never loud, never gamified, never juvenile. It should communicate that the AI's output deserves the same scrutiny as any other claim about mathematics, which is why the confidence widget and verified textbook source are first-class citizens of the UI rather than footnotes. The user should feel that their question is being taken seriously.

**Typography direction.** A pairing that signals both warmth and precision:
- A modern humanist or geometric sans for body and headings (Geist Sans is already loaded and is a strong default; Inter or Söhne would also work). The current Arial fallback is wrong for the product's positioning and should be replaced.
- A monospace with strong code legibility (Geist Mono is loaded; JetBrains Mono is a reasonable alternative).
- Mathematical content (formulas, the concept name) deserves a typographic moment. Consider rendering the concept name in a slightly larger, more deliberate style — possibly italic serif for variable-name-like feel, or in mono for textbook-index feel.

**Color direction.** The current palette is functional dark grey (`zinc`) which is competent but anonymous. Suggested directions, any of which would suit the product:
- A near-black background with a single deeply-saturated accent (cobalt blue, deep teal, or magenta) — the 3Blue1Brown lineage.
- A warm dark (slight brown undertone) to read more "lecture hall" than "developer tool".
- A bright, paper-like light theme with strong typography — uncommon for AI tools, would stand out.
- Confidence colors should remain semantically distinct (not all blue) but can be desaturated from the current pure red/yellow/green to feel less "stoplight". Recommended: muted coral, amber/ochre, sage.

**Motion direction.** Because the product itself is about animation, motion in the chrome should be deliberate and minimal — anything flashy will compete with the actual Manim videos. Use motion to:
- Soften screen transitions between upload and result.
- Mask the long render wait with a meaningful loader (e.g. an animated illustration of geometry being constructed, a slow gradient shimmer on the video frame, or a typewriter effect on the concept name as it arrives) rather than a generic spinner.
- Reveal the clarification card when it is appended, so the user notices it (the current append is silent).
- Motion should respect `prefers-reduced-motion`.

**This interface should absolutely not look like:** a SaaS dashboard, a developer-tool playground (Playgrounds, Replits, Claude.ai's code panel), a chatbot, a generic AI demo with neon gradients, a Bootstrap admin theme, or anything that signals "we built this in 24 hours" — even though we did. It should not look gamified, not have rounded chunky cartoon shapes, not use emojis as visual elements, not have purple-pink AI gradients.

**The single most important feeling on first paint:** *"This tool understands the thing I'm trying to understand."* Not "this tool is impressive" or "this tool is fast" — those are second-order. The user landed here because they didn't get it, and the interface should signal, before they even click, that the rest of the product was made by people who care about getting it.

---

## SECTION 7 — Screen-by-Screen Design Specifications

### UploadScreen

**Visual focus:** the drop zone. Title and pitch are introduction; the action is clear. The submit button only exists conditionally and is a secondary focus that emerges after a file is chosen.

**Spatial requirements:**
- The page should feel composed and centered, not stretched to fill the viewport. Generous vertical whitespace above and below the centered column is correct.
- Title and tagline are above the drop zone, center-aligned.
- Drop zone is the largest interactive surface on the page. It should communicate "drop here / click here" without text alone — a glyph or geometric mark is appropriate. Hovering should give clear visual feedback (border, shadow, or fill change). Drag-and-drop is not currently implemented but the visual affordance suggests it; the redesign may add real drag-and-drop or remove the dashed-border affordance, but should be deliberate.
- After a file is selected, the drop zone shows a thumbnail of the chosen image. The submit button appears below as the next obvious action — full-width and visually weighty.
- Loading state should replace the submit button (not stack with it). The loader has to read clearly because the wait is 25–45 seconds; the redesign should treat this as a feature surface, not a spinner.
- Errors appear below the column, full-width, in a clearly destructive style. Errors should not shift the rest of the layout.

**What must stay:** a file `<input type="file" accept="image/*">` reachable via clicking the drop zone, a submit action that calls `handleGenerate`, a visible loading state during request, a visible error state on failure.

### ResultScreen

**Visual focus on first paint (before video renders):** the *concept name* and the placeholder video panel. The concept name is the headline answer to the user's question — what Claude thinks they were asking about. It should be the most visible piece of text on the page when the user lands here, not buried inside the SourceCard. The redesign should consider promoting it to a page-level heading.

**Visual focus once video renders:** the video itself.

**How the confidence badge integrates:** the confidence widget belongs near the video, not as a footnote. It is a verdict on the video and should read as such. Consider:
- An inline color band on the video frame itself (subtle, only visible if confidence is low) rather than a separate widget.
- A confidence chip overlaid on the video corner, with the score and a click target that expands to the full reason.
- The current full-width widget below the video is also acceptable, but the "Animation Confidence" label is too quiet given how important this signal is.

**How the concept label is displayed:** currently it is the heading inside SourceCard, a small label saying "Claude identified this concept as:" then the term. The redesign should give the concept name room to breathe — consider it as a kind of subhead under the page title, or as a labeled card with the term in larger type. Treat it as the answer to "what is this about?" — the user should know without scanning.

**How code and video relate spatially:** currently the screen is a 50/50 split, code on the left, video on the right. The video is what the user actually wants to see; the code is supporting evidence ("here's what Claude wrote that produced this"). A 60/40 or 70/30 split favoring the video would better match the priority. Alternatively, the code could collapse into a togglable panel ("View source") to keep the focus on the visual output. Both are valid directions — the current 50/50 over-emphasizes the code.

**Where the Try Again button lives:** at the bottom of the page, centered, currently in muted grey. It should remain easy to find but not compete with the primary content. Below the clarifications list (when present) is correct — the user only resets after they're done with the current concept.

**Clarifications section:** currently appended below the main grid as a stacked list, each with a "Clarification N" pill, the question in italics, and a 50/50 code/video grid. The redesign may keep this structure but should treat each clarification as a discrete unit (a card, not just stacked content) so multiple clarifications don't run together visually. Each clarification's video should also receive priority over its code panel.

**Loading state for the clarification flow:** currently invisible — the input disables and the button changes label. There is no preview of what's about to happen. The redesign should make it obvious that something is rendering, ideally near where the clarification will land (e.g. a placeholder card already appearing in the list with a shimmer).

---

## SECTION 8 — Component-Level Design Notes

### `Home` (page.tsx)

- Not visible directly; switches between UploadScreen and ResultScreen.
- The redesign may add a transitional layer (e.g. fading the upload screen into a generic "result loading" screen before ResultScreen mounts) but must preserve the `state === 'upload' | 'result'` model and the prop signatures.
- Free to change: nothing here is rendered.

### `UploadScreen`

- **Must preserve:** the file input element, the call to `handleGenerate` on submit, the `loading` state guard (don't allow double-submit), the error display, the call to `onResult(...)` with all 8 positional args.
- **Free to change:** every class name, the layout, the typography, the use of an inline SVG icon (could be replaced with a different glyph or an animated mark), the dashed-border drop zone affordance, the position of the submit button.
- **Logic-bound elements:** none — all interactivity is via React props and refs. No element is selected by class name from outside the component.

### `ResultScreen`

- **Must preserve:** the `useEffect` that calls `/api/render` on mount and on `manim_code` change (this is what produces the unique video URL — removing or restructuring it brings back the "always shows the same video" bug). The `key={originalVideoUrl}` on the main `<video>` and `key={c.video_url}` on each clarification `<video>` are also load-bearing for the same reason.
- **Must preserve:** the `<video>` `src`, `controls`, `autoPlay`, `muted` attributes (autoplay only works when muted; removing `muted` will silently break the auto-play UX in most browsers).
- **Must preserve:** the follow-up input's `onKeyDown` Enter-submit handler.
- **Must preserve:** the immutability of past clarifications — appending a new one must not replace or visually displace older ones.
- **Free to change:** the 2-column grid (could be 3-column, stacked, or a different shape entirely), the placement of ConfidenceWidget and SourceCard, the styling of the code `<pre>`, the loading-state copy, the "Try Another" copy and placement.
- **Logic-bound elements:** none by selector. The `getVideoSrc` helper (keyword-matching for fallback to pre-rendered demo videos) can stay as is or be moved/refactored.

### `ConfidenceWidget` (inline in ResultScreen.tsx)

- **Must preserve:** the early `return null` when `confidenceScore === null` (otherwise the widget would render with an undefined-value bar), the score-tier color logic (or some equivalent), and the popup dismissal on overlay click.
- **Free to change:** the entire visual treatment — bar vs. radial gauge vs. typographic-only. The unicode `ⓘ` glyph for the info button can be replaced with an SVG icon. The popup can become a real `<dialog>` element (recommended for accessibility).
- **Bug to fix:** the `confidenceFlag` prop is passed in but never used inside the widget. The redesign should either remove the prop or actually use it (e.g. flag = true could trigger a more prominent warning treatment beyond just color).
- **Accessibility upgrade target:** the popup should be focus-trapped and dismissable by Escape key.

### `SourceCard` (inline in ResultScreen.tsx)

- **Must preserve:** the early `return null` when `conceptName === null`, the no-resource case (concept name without URL still renders).
- **Must preserve:** the link's `target="_blank" rel="noopener noreferrer"` — this is a security baseline.
- **Free to change:** the entire visual treatment, the "→" trailing glyph (could be a real arrow icon), the disclaimer text styling, the left-border accent.
- **Promotion candidate:** this is where the canonical concept name lives. The redesign should evaluate whether the concept name should be promoted out of this card and rendered as a top-level page title or subhead, with the source link being a smaller annotation. See Section 7 notes.

### `RootLayout` (layout.tsx)

- **Must preserve:** loading the Geist fonts via `next/font/google` (or replacing them with another `next/font` import — but loading must happen here to avoid layout shift).
- **Should fix:** the `<title>` is "Create Next App". The redesign should set a real title and description.
- **Free to change:** the body classes, adding a header/footer wrapper if the design calls for one (currently neither is rendered).

### `globals.css`

- **Must preserve:** `@import "tailwindcss";` at the top and the `@theme inline { ... }` block as the way to register tokens.
- **Should fix:** the `body { font-family: Arial, ... }` rule is overriding the Geist fonts. Replace with `font-family: var(--font-geist-sans), system-ui, sans-serif;` (or swap in a different font once the typography decision is made).
- **Free to change / extend:** add any number of custom CSS variables, keyframe animations, or `@theme` token registrations. This is the right place for the redesign's design tokens to live.
