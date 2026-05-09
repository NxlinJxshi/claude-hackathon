'use client';

import { useEffect, useState } from 'react';

interface ResultScreenProps {
  manim_code: string;
  explanation: string;
  confidenceScore: number | null;
  confidenceReason: string;
  confidenceFlag: boolean;
  conceptName: string | null;
  resourceUrl: string | null;
  resourceTitle: string | null;
  onReset: () => void;
}

interface Clarification {
  question: string;
  manim_code: string;
  video_url: string;
}

const C = {
  bg: '#0b1014',
  panel: '#11181f',
  panel2: '#0a1015',
  rule: '#1c2730',
  rule2: '#2a3a45',
  ink: '#e6eef4',
  ink2: '#b0bcc6',
  ink3: '#6f8090',
  ink4: '#4a5867',
  accent: '#7fc4ff',
  accent2: '#a7d8ff',
  accent_soft: 'rgba(127, 196, 255, 0.14)',
  good: '#5fbf7e',
  warn: '#e1b545',
  bad: '#e07b62',
  mono: 'var(--mono)',
  serif: 'var(--serif)',
} as const;

const META: React.CSSProperties = {
  fontFamily: C.mono,
  fontSize: '10.5px',
  letterSpacing: '.18em',
  textTransform: 'uppercase',
  color: C.ink3,
  fontWeight: 500,
};

type Tier = 'good' | 'warn' | 'bad' | 'unknown';

function tierFromScore(score: number | null): Tier {
  if (score === null) return 'unknown';
  if (score >= 4) return 'good';
  if (score === 3) return 'warn';
  return 'bad';
}

function tierColor(t: Tier): string {
  if (t === 'good') return C.good;
  if (t === 'warn') return C.warn;
  if (t === 'bad') return C.bad;
  return C.ink3;
}

function tierLabel(t: Tier): string {
  if (t === 'good') return 'high confidence';
  if (t === 'warn') return 'verify a step';
  if (t === 'bad') return 'flagged · likely mismatch';
  return 'unrated';
}

function tierShort(t: Tier): string {
  if (t === 'good') return 'consistent';
  if (t === 'warn') return 'partial match';
  if (t === 'bad') return 'flagged · likely mismatch';
  return 'unrated';
}

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getVideoSrc(code: string): string {
  if (/continuity|continuous/i.test(code)) return '/animations/continuity.mp4';
  if (/differentiab/i.test(code)) return '/animations/differentiability.mp4';
  return '/animations/continuity.mp4';
}

function TopBar() {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        paddingBottom: '18px',
        borderBottom: `1px solid ${C.rule}`,
      }}
    >
      <div
        style={{
          fontFamily: C.mono,
          fontWeight: 500,
          fontSize: '13.5px',
          letterSpacing: '.02em',
          color: C.ink,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span style={{ color: C.ink3 }}>[</span>
        manim
        <span
          style={{
            width: '6px',
            height: '6px',
            background: C.accent,
            display: 'inline-block',
            margin: '0 8px',
            transform: 'translateY(-1px)',
          }}
        />
        ai
        <span style={{ color: C.ink3 }}>]</span>
      </div>
      <div style={{ ...META, color: C.ink4 }}>v0 · screenshot → manim → mp4</div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: '18px', color: C.ink3 }}>
        <span style={{ ...META, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: C.good,
              boxShadow: '0 0 8px rgba(95,191,126,.5)',
            }}
          />
          claude · sonnet 4
        </span>
        <span
          style={{
            ...META,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            opacity: 0.6,
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: C.ink4,
            }}
          />
          manim 0.18
        </span>
      </div>
    </header>
  );
}

function Pill({
  tone = 'default',
  children,
  ledOn = true,
}: {
  tone?: 'default' | 'good' | 'warn' | 'bad' | 'dim';
  children: React.ReactNode;
  ledOn?: boolean;
}) {
  const ledColor =
    tone === 'good' || tone === 'default'
      ? C.good
      : tone === 'warn'
      ? C.warn
      : tone === 'bad'
      ? C.bad
      : C.ink4;
  const borderColor =
    tone === 'warn'
      ? 'rgba(225,181,69,.4)'
      : tone === 'bad'
      ? 'rgba(224,123,98,.4)'
      : C.rule2;
  const textColor = tone === 'warn' ? C.warn : tone === 'bad' ? C.bad : C.ink2;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(8,12,15,.5)',
        border: `1px solid ${borderColor}`,
        fontFamily: C.mono,
        fontSize: '10.5px',
        letterSpacing: '.14em',
        textTransform: 'uppercase',
        padding: '5px 9px 4px',
        color: textColor,
      }}
    >
      {ledOn && (
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: ledColor,
            boxShadow: tone === 'dim' ? 'none' : `0 0 6px ${ledColor}88`,
          }}
        />
      )}
      {children}
    </span>
  );
}

function ConfidenceCard({
  confidenceScore,
  confidenceReason,
  onOpenInfo,
}: {
  confidenceScore: number | null;
  confidenceReason: string;
  onOpenInfo: () => void;
}) {
  const tier = tierFromScore(confidenceScore);
  const fillCount =
    confidenceScore === null
      ? 0
      : Math.max(0, Math.min(5, Math.round(confidenceScore)));
  const fillColor = tierColor(tier);
  const numColor = tier === 'unknown' ? C.ink3 : fillColor;
  const labels = ['i', 'ii', 'iii', 'iv', 'v'];

  return (
    <div
      style={{
        background: C.panel2,
        border: `1px solid ${C.rule}`,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '-2px 0 4px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={META}>[ confidence ]</span>
          <button
            onClick={onOpenInfo}
            aria-label="how this score is calculated"
            title="how this score is calculated"
            style={{
              appearance: 'none',
              background: C.accent_soft,
              border: `1px solid ${C.accent}`,
              color: C.accent,
              width: '22px',
              height: '22px',
              fontSize: '13px',
              fontStyle: 'italic',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              lineHeight: 1,
              fontFamily: C.serif,
              transition: 'background .15s, color .15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget;
              el.style.background = C.accent;
              el.style.color = '#06121d';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget;
              el.style.background = C.accent_soft;
              el.style.color = C.accent;
            }}
          >
            i
          </button>
        </div>
        <span style={{ ...META, color: C.ink4 }}>claude review · pass 02</span>
      </header>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div
          style={{
            fontFamily: C.mono,
            fontWeight: 600,
            fontSize: '34px',
            lineHeight: 1,
            color: numColor,
            letterSpacing: '-.02em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {confidenceScore === null ? '—' : confidenceScore.toFixed(1)}
          <span style={{ color: C.ink4, fontWeight: 400 }}> / 5</span>
        </div>
        <div style={{ ...META, color: numColor, fontSize: '10.5px' }}>{tierShort(tier)}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {labels.map((lab, i) => (
            <div
              key={lab}
              style={{
                flex: 1,
                height: '16px',
                border: `1px solid ${C.rule2}`,
                background: 'transparent',
                position: 'relative',
              }}
            >
              {i < fillCount && (
                <div
                  style={{ position: 'absolute', inset: 0, background: fillColor }}
                />
              )}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '100%',
                  textAlign: 'center',
                  marginTop: '6px',
                  fontSize: '9.5px',
                  color: C.ink4,
                  letterSpacing: '.16em',
                  fontFamily: C.mono,
                }}
              >
                {lab}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: '18px',
          fontSize: '12px',
          lineHeight: 1.55,
          color: C.ink2,
          fontFamily: C.mono,
        }}
      >
        <span style={{ color: C.accent, fontWeight: 500 }}>$ </span>
        {confidenceReason || 'No verdict available.'}
      </div>
    </div>
  );
}

function SourceCard({
  conceptName,
  resourceUrl,
  resourceTitle,
}: {
  conceptName: string | null;
  resourceUrl: string | null;
  resourceTitle: string | null;
}) {
  if (!conceptName) return null;

  return (
    <div
      style={{
        background: C.panel2,
        border: `1px solid ${C.rule}`,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '-2px 0 4px',
        }}
      >
        <span style={META}>[ verified source ]</span>
        <span style={{ ...META, color: C.ink4 }}>tavily · trusted index</span>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={META}>claude identified concept as</span>
        <div
          style={{
            fontFamily: C.mono,
            fontSize: '14.5px',
            color: C.ink,
            fontWeight: 500,
            letterSpacing: 0,
          }}
        >
          {conceptName}
        </div>
      </div>

      {resourceUrl && resourceTitle ? (
        <>
          <a
            href={resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              padding: '10px 12px',
              border: `1px solid ${C.rule2}`,
              background: 'rgba(127,196,255,.04)',
              color: C.accent,
              fontSize: '12px',
              textDecoration: 'none',
              fontFamily: C.mono,
              transition: 'background .15s, border-color .15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget;
              el.style.background = 'rgba(127,196,255,.08)';
              el.style.borderColor = C.accent;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget;
              el.style.background = 'rgba(127,196,255,.04)';
              el.style.borderColor = C.rule2;
            }}
          >
            <span>{resourceTitle}</span>
            <span style={{ fontSize: '14px' }}>↗</span>
          </a>
          <div
            style={{
              fontSize: '10.5px',
              color: C.ink4,
              letterSpacing: '.04em',
              lineHeight: 1.55,
              fontFamily: C.mono,
            }}
          >
            cross-checked against khan academy, mit ocw, paul&apos;s online math notes only.
          </div>
        </>
      ) : (
        <div
          style={{
            border: `1px dashed ${C.rule2}`,
            padding: '10px 12px',
            color: C.ink3,
            fontSize: '11.5px',
            lineHeight: 1.5,
            fontFamily: C.mono,
          }}
        >
          <div
            style={{
              color: C.ink2,
              letterSpacing: '.16em',
              textTransform: 'uppercase',
              fontSize: '10px',
              marginBottom: '4px',
            }}
          >
            [ none ]
          </div>
          no match in trusted index. concept name is canonical — the absent reference reflects index coverage, not low confidence in the term itself.
        </div>
      )}
    </div>
  );
}

function ConfidenceDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2,5,8,.65)',
        zIndex: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d141a',
          border: `1px solid ${C.rule2}`,
          maxWidth: '520px',
          width: '100%',
          padding: '24px 26px',
          fontFamily: C.mono,
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '14px',
          }}
        >
          <h3
            style={{
              fontFamily: C.mono,
              fontSize: '13px',
              letterSpacing: '.16em',
              textTransform: 'uppercase',
              color: C.ink2,
              fontWeight: 500,
              margin: 0,
            }}
          >
            [ how this score is computed ]
          </h3>
          <button
            onClick={onClose}
            aria-label="close"
            style={{
              appearance: 'none',
              background: 'none',
              border: `1px solid ${C.rule2}`,
              color: C.ink3,
              width: '24px',
              height: '24px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: C.mono,
            }}
          >
            ×
          </button>
        </header>
        <p
          style={{
            fontSize: '12.5px',
            lineHeight: 1.65,
            color: C.ink2,
            margin: 0,
          }}
        >
          After drafting the scene, Claude re-reads your screenshot, the generated Manim code, and
          the explanation, then estimates how faithfully the code represents the concept on a 1–5
          scale. The score is Claude&apos;s <em>self-assessment</em>, not a proof — the code is not
          executed, and no theorem is checked.
        </p>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: `1px solid ${C.rule}`,
          }}
        >
          {[
            { sw: C.good, lab: 'iv–v', txt: 'consistent with the screenshot' },
            { sw: C.warn, lab: 'iii', txt: 'partial match — verify a step' },
            { sw: C.bad, lab: 'i–ii', txt: 'flagged · likely mismatch' },
          ].map(r => (
            <div
              key={r.lab}
              style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '11px', color: C.ink2 }}
            >
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: r.sw,
                  flex: 'none',
                }}
              />
              <span>
                <b>{r.lab}</b> &nbsp;·&nbsp; {r.txt}
              </span>
            </div>
          ))}
        </div>
        <footer style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
          <span
            style={{
              fontSize: '10px',
              letterSpacing: '.16em',
              textTransform: 'uppercase',
              color: C.ink4,
              fontFamily: C.mono,
            }}
          >
            esc · click outside to dismiss
          </span>
        </footer>
      </div>
    </div>
  );
}

export default function ResultScreen({
  manim_code,
  explanation,
  confidenceScore,
  confidenceReason,
  conceptName,
  resourceUrl,
  resourceTitle,
  onReset,
}: ResultScreenProps) {
  const tier = tierFromScore(confidenceScore);

  const [originalVideoUrl, setOriginalVideoUrl] = useState<string | null>(null);
  const [originalVideoRendering, setOriginalVideoRendering] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setOriginalVideoRendering(true);
    setOriginalVideoUrl(null);

    fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manim_code, scene_name: 'GeneratedScene' }),
    })
      .then(r => r.json())
      .then(data => {
        if (!cancelled) setOriginalVideoUrl(data.video_url ?? getVideoSrc(manim_code));
      })
      .catch(() => {
        if (!cancelled) setOriginalVideoUrl(getVideoSrc(manim_code));
      })
      .finally(() => {
        if (!cancelled) setOriginalVideoRendering(false);
      });

    return () => {
      cancelled = true;
    };
  }, [manim_code]);

  const [clarifications, setClarifications] = useState<Clarification[]>([]);
  const [followUp, setFollowUp] = useState('');
  const [clarifyLoading, setClarifyLoading] = useState(false);
  const [clarifyError, setClarifyError] = useState<string | null>(null);

  const [codeCollapsed, setCodeCollapsed] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  async function handleClarify() {
    const question = followUp.trim();
    if (!question || clarifyLoading) return;

    setClarifyLoading(true);
    setClarifyError(null);

    try {
      const clarifyRes = await fetch('/api/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manim_code, explanation, question }),
      });
      const clarifyData = await clarifyRes.json();

      if (!clarifyRes.ok || clarifyData.error) {
        throw new Error(clarifyData.error ?? 'Clarification request failed');
      }

      const clarification_code: string = clarifyData.manim_code;

      const renderRes = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manim_code: clarification_code,
          scene_name: 'ClarificationScene',
        }),
      });
      const renderData = await renderRes.json();

      if (!renderRes.ok || renderData.error) {
        throw new Error(renderData.error ?? 'Render failed');
      }

      const clarificationVideoUrl: string = renderData.video_url;

      if (!clarificationVideoUrl) {
        throw new Error('Render succeeded but no video URL in response');
      }

      setClarifications(prev => [
        ...prev,
        { question, manim_code: clarification_code, video_url: clarificationVideoUrl },
      ]);
      setFollowUp('');
    } catch (err) {
      setClarifyError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setClarifyLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleClarify();
  }

  const folioStatus = originalVideoRendering
    ? 'rendering scene · ≈ 40s'
    : tier === 'bad'
    ? 'animation rendered · ⚠ flagged'
    : tier === 'warn'
    ? 'animation rendered · verify'
    : 'animation rendered';

  const lowConfBorder = tier === 'bad';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 32px 80px',
        maxWidth: '1320px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      <TopBar />

      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '26px',
          paddingTop: '22px',
        }}
      >
        {/* Result header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            borderBottom: `1px solid ${C.rule}`,
            paddingBottom: '22px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                color: C.ink3,
                fontSize: '10.5px',
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                fontFamily: C.mono,
              }}
            >
              <span>folio · 01</span>
              <span style={{ opacity: 0.4 }}>/</span>
              <span>{folioStatus}</span>
              <span style={{ opacity: 0.4 }}>/</span>
              <span>{nowHHMM()} local</span>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {confidenceScore !== null && (
                <Pill tone={tier === 'good' ? 'good' : tier === 'warn' ? 'warn' : 'bad'}>
                  <span style={{ color: C.ink }}>
                    {confidenceScore.toFixed(1)} / 5
                  </span>
                  &nbsp;<span style={{ opacity: 0.5 }}>·</span>&nbsp;
                  {tierLabel(tier)}
                </Pill>
              )}
              {resourceUrl && (
                <Pill tone="good">
                  <span style={{ color: C.ink }}>verified source</span>
                </Pill>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={META}>claude identifies this as</span>
            <div
              style={{
                fontFamily: C.mono,
                fontWeight: 500,
                fontSize: '36px',
                letterSpacing: '-.015em',
                color: C.ink,
                lineHeight: 1.05,
              }}
            >
              <span style={{ color: C.ink3, fontWeight: 300 }}>[ </span>
              {conceptName ?? 'untitled scene'}
              <span style={{ color: C.ink3, fontWeight: 300 }}> ]</span>
            </div>
            {explanation && (
              <div
                style={{
                  fontFamily: C.serif,
                  fontStyle: 'italic',
                  fontWeight: 500,
                  color: C.ink2,
                  fontSize: '17px',
                  letterSpacing: '.005em',
                  marginTop: '4px',
                  lineHeight: 1.5,
                  maxWidth: '720px',
                }}
              >
                {explanation}
              </div>
            )}
          </div>
        </div>

        {/* Main grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 1fr)',
            gap: '24px',
          }}
          className="result-grid"
        >
          {/* Video + code column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>
            {/* Video */}
            <div
              style={{
                position: 'relative',
                background: '#04080b',
                border: `1px solid ${lowConfBorder ? 'rgba(225,181,69,.55)' : C.rule}`,
                boxShadow: lowConfBorder ? '0 0 0 1px rgba(225,181,69,.15)' : undefined,
                aspectRatio: '16 / 9',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  display: 'flex',
                  gap: '8px',
                  zIndex: 3,
                }}
              >
                <Pill
                  tone={
                    originalVideoRendering
                      ? 'dim'
                      : lowConfBorder
                      ? 'warn'
                      : 'good'
                  }
                >
                  <span style={{ color: C.ink }}>
                    {originalVideoRendering ? 'rendering' : 'render'}
                  </span>
                </Pill>
              </div>
              {originalVideoUrl && !originalVideoRendering && (
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    display: 'flex',
                    gap: '8px',
                    zIndex: 3,
                  }}
                >
                  <Pill tone="default" ledOn={false}>
                    <span style={{ color: C.ink }}>GeneratedScene</span>
                  </Pill>
                </div>
              )}

              {originalVideoRendering ? (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: C.ink3,
                      fontSize: '11px',
                      letterSpacing: '.16em',
                      textTransform: 'uppercase',
                      fontFamily: C.mono,
                    }}
                  >
                    [ rendering scene · ≈ 40s ]
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: '1px',
                      background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)`,
                      transform: 'translateX(-100%)',
                      animation: 'shimmer 2s infinite',
                    }}
                  />
                </>
              ) : originalVideoUrl ? (
                <video
                  key={originalVideoUrl}
                  src={originalVideoUrl}
                  controls
                  autoPlay
                  muted
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    background: '#04080b',
                  }}
                />
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: C.ink4,
                    fontSize: '11px',
                    letterSpacing: '.16em',
                    textTransform: 'uppercase',
                    fontFamily: C.mono,
                  }}
                >
                  video unavailable
                </div>
              )}
            </div>

            {/* Code panel */}
            <div
              style={{
                background: C.panel2,
                border: `1px solid ${C.rule}`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <header
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderBottom: codeCollapsed ? 'none' : `1px solid ${C.rule}`,
                  color: C.ink3,
                  fontSize: '10.5px',
                  letterSpacing: '.16em',
                  textTransform: 'uppercase',
                  fontFamily: C.mono,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: C.ink2 }}>[ source ]</span>
                  <span>manim · GeneratedScene</span>
                </div>
                <div style={{ display: 'flex', gap: '14px' }}>
                  <button
                    onClick={() => navigator.clipboard?.writeText(manim_code)}
                    style={{
                      cursor: 'pointer',
                      color: C.ink3,
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontFamily: C.mono,
                      fontSize: 'inherit',
                      letterSpacing: 'inherit',
                      textTransform: 'inherit',
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = C.accent)}
                    onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = C.ink3)}
                  >
                    copy
                  </button>
                  <button
                    onClick={() => setCodeCollapsed(v => !v)}
                    style={{
                      cursor: 'pointer',
                      color: C.ink3,
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontFamily: C.mono,
                      fontSize: 'inherit',
                      letterSpacing: 'inherit',
                      textTransform: 'inherit',
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = C.accent)}
                    onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = C.ink3)}
                  >
                    {codeCollapsed ? '⏷ show' : '⏶ hide'}
                  </button>
                </div>
              </header>
              {!codeCollapsed && (
                <pre
                  style={{
                    padding: '14px 16px',
                    fontFamily: C.mono,
                    fontSize: '11.5px',
                    lineHeight: 1.65,
                    color: C.ink2,
                    overflow: 'auto',
                    maxHeight: '60vh',
                    whiteSpace: 'pre',
                    margin: 0,
                  }}
                >
                  {manim_code}
                </pre>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              minWidth: 0,
            }}
          >
            <ConfidenceCard
              confidenceScore={confidenceScore}
              confidenceReason={confidenceReason}
              onOpenInfo={() => setInfoOpen(true)}
            />
            <SourceCard
              conceptName={conceptName}
              resourceUrl={resourceUrl}
              resourceTitle={resourceTitle}
            />

            {/* Ask card */}
            <div
              style={{
                background: C.panel2,
                border: `1px solid ${C.rule}`,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <header
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  margin: '-2px 0 4px',
                }}
              >
                <span style={META}>[ ask deeper ]</span>
                <span style={{ ...META, color: C.ink4 }}>⏎ to render · ~ 40s</span>
              </header>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  border: `1px solid ${C.rule2}`,
                  background: '#06090c',
                  transition: 'border-color .15s',
                }}
              >
                <input
                  type="text"
                  value={followUp}
                  onChange={e => setFollowUp(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={clarifyLoading}
                  placeholder="explain the limit step in more detail…"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: C.ink,
                    fontFamily: C.mono,
                    fontSize: '12.5px',
                    padding: '11px 12px',
                  }}
                />
                <button
                  onClick={handleClarify}
                  disabled={!followUp.trim() || clarifyLoading}
                  style={{
                    appearance: 'none',
                    border: 'none',
                    background:
                      !followUp.trim() || clarifyLoading ? C.rule2 : C.accent,
                    color: !followUp.trim() || clarifyLoading ? C.ink4 : '#06121d',
                    fontFamily: C.mono,
                    fontSize: '10.5px',
                    letterSpacing: '.16em',
                    textTransform: 'uppercase',
                    padding: '0 14px',
                    cursor: !followUp.trim() || clarifyLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {clarifyLoading ? 'rendering…' : 'explain ⏎'}
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: C.ink4,
                  fontSize: '10px',
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                  fontFamily: C.mono,
                }}
              >
                <span>renders a short clarification scene</span>
                <span>{clarifyLoading ? 'drafting' : 'idle'}</span>
              </div>

              {clarifyError && (
                <div
                  style={{
                    border: '1px solid #5a2a26',
                    background: 'rgba(120,40,32,.10)',
                    color: '#e9a48f',
                    padding: '10px 12px',
                    fontFamily: C.mono,
                    fontSize: '11px',
                    lineHeight: 1.55,
                    marginTop: '4px',
                  }}
                >
                  <span style={{ color: C.bad }}>[err] </span>
                  {clarifyError}
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Clarifications */}
        {clarifications.length > 0 && (
          <section
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              borderTop: `1px solid ${C.rule}`,
              paddingTop: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
              }}
            >
              <h2
                style={{
                  fontFamily: C.mono,
                  fontSize: '13px',
                  fontWeight: 500,
                  letterSpacing: '.16em',
                  textTransform: 'uppercase',
                  color: C.ink2,
                  margin: 0,
                }}
              >
                [ clarifications ]
              </h2>
              <span style={{ ...META, color: C.ink4 }}>
                {String(clarifications.length).padStart(2, '0')} entries · oldest first
              </span>
            </div>

            {clarifications.map((c, i) => (
              <div
                key={i}
                className="fade-in"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '48px 1fr',
                  gap: '18px',
                  border: `1px solid ${C.rule}`,
                  padding: '18px',
                  background: C.panel2,
                }}
              >
                <div
                  style={{
                    color: C.accent,
                    fontFamily: C.mono,
                    fontSize: '11px',
                    letterSpacing: '.14em',
                    borderRight: `1px solid ${C.rule}`,
                    paddingRight: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div>#{String(i + 1).padStart(2, '0')}</div>
                  <div style={{ color: C.ink4, fontSize: '9.5px' }}>{nowHHMM()}</div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
                    gap: '18px',
                    minWidth: 0,
                  }}
                  className="clar-grid"
                >
                  <div
                    style={{
                      position: 'relative',
                      background: '#04080b',
                      border: `1px solid ${C.rule}`,
                      aspectRatio: '21 / 9',
                      overflow: 'hidden',
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        zIndex: 3,
                      }}
                    >
                      <Pill tone="good">
                        <span style={{ color: C.ink }}>rendered</span>
                      </Pill>
                    </div>
                    <video
                      key={c.video_url}
                      src={c.video_url}
                      controls
                      autoPlay
                      muted
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        background: '#04080b',
                      }}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        color: C.ink,
                        fontSize: '13.5px',
                        lineHeight: 1.5,
                        fontFamily: C.mono,
                      }}
                    >
                      <span style={{ color: C.accent }}>› </span>
                      {c.question}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        marginTop: '8px',
                        color: C.ink4,
                        fontSize: '10px',
                        letterSpacing: '.14em',
                        textTransform: 'uppercase',
                        fontFamily: C.mono,
                      }}
                    >
                      <span>rendered</span>
                      <span>scene · ClarificationScene</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Reset */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: '14px',
            borderTop: `1px solid ${C.rule}`,
            marginTop: '8px',
          }}
        >
          <button
            onClick={onReset}
            style={{
              appearance: 'none',
              background: 'transparent',
              border: `1px solid ${C.rule2}`,
              color: C.ink2,
              fontFamily: C.mono,
              fontSize: '11px',
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              padding: '10px 22px',
              cursor: 'pointer',
              transition: 'border-color .15s, color .15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget;
              el.style.borderColor = C.accent;
              el.style.color = C.accent;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget;
              el.style.borderColor = C.rule2;
              el.style.color = C.ink2;
            }}
          >
            ⟲ &nbsp; try another concept
          </button>
        </div>
      </section>

      {infoOpen && <ConfidenceDialog onClose={() => setInfoOpen(false)} />}

      <style>{`
        @media (max-width: 920px) {
          .result-grid { grid-template-columns: 1fr !important; }
          .clar-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
