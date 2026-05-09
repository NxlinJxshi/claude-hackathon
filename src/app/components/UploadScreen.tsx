'use client';

import { useEffect, useRef, useState } from 'react';

interface UploadScreenProps {
  onResult: (
    manim_code: string,
    explanation: string,
    confidence_score: number | null,
    confidence_reason: string,
    confidence_flag: boolean,
    concept_name: string | null,
    resource_url: string | null,
    resource_title: string | null,
  ) => void;
}

const C = {
  bg: '#0b1014',
  panel: '#0a1015',
  rule: '#1c2730',
  rule2: '#2a3a45',
  ink: '#e6eef4',
  ink2: '#b0bcc6',
  ink3: '#6f8090',
  ink4: '#4a5867',
  accent: '#7fc4ff',
  accent2: '#a7d8ff',
  good: '#5fbf7e',
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

function BracketUploadIcon() {
  return (
    <svg width="64" height="48" viewBox="0 0 64 48" fill="none" aria-hidden>
      <path d="M14 6 H6 V42 H14" stroke={C.accent} strokeWidth="1.5" />
      <path d="M50 6 H58 V42 H50" stroke={C.accent} strokeWidth="1.5" />
      <path
        d="M22 30 L32 18 L42 30"
        stroke={C.ink}
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <line x1="32" y1="18" x2="32" y2="36" stroke={C.ink} strokeWidth="1.5" />
    </svg>
  );
}

function LiveLogLoader() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsed((Date.now() - start) / 1000), 250);
    return () => clearInterval(id);
  }, []);

  const lines: { t: string; body: React.ReactNode; show: number }[] = [
    {
      t: '[00.4s]',
      body: (
        <>
          img.upload &nbsp;
          <span style={{ color: C.good }}>OK</span>
        </>
      ),
      show: 0,
    },
    {
      t: '[01.1s]',
      body: <>claude.vision &nbsp; reading screenshot…</>,
      show: 1,
    },
    {
      t: '[04.8s]',
      body: (
        <>
          concept &nbsp;
          <span style={{ color: C.accent }}>identifying…</span>
        </>
      ),
      show: 5,
    },
    {
      t: '[06.2s]',
      body: <>manim.draft &nbsp; writing scene…</>,
      show: 8,
    },
    {
      t: '[21.4s]',
      body: (
        <>
          claude.review &nbsp; assessing fidelity…
        </>
      ),
      show: 22,
    },
    {
      t: '[28.4s]',
      body: <>tavily.search &nbsp; cross-checking against trusted index…</>,
      show: 29,
    },
  ];

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(Math.floor(elapsed % 60)).padStart(2, '0');

  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.rule}`,
        padding: '20px 22px',
        fontFamily: C.mono,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px' }}>
        <div style={{ ...META, color: C.accent }}>
          [ generating · {mm}:{ss} ]
        </div>
        <div style={{ ...META, color: C.ink4 }}>est. ~ 00:40</div>
      </div>
      <div style={{ height: '2px', background: C.rule, position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            background: C.accent,
            width: `${Math.min(100, (elapsed / 40) * 100)}%`,
            transition: 'width .3s ease',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: '30%',
            background: 'linear-gradient(90deg, transparent, rgba(127,196,255,.5), transparent)',
            animation: 'shimmer 2s infinite',
          }}
        />
      </div>
      <div
        style={{
          marginTop: '16px',
          fontSize: '11.5px',
          lineHeight: 1.85,
          color: C.ink3,
          fontFamily: C.mono,
        }}
      >
        {lines
          .filter(l => elapsed >= l.show)
          .map((l, i, arr) => (
            <div
              key={l.t}
              className={i === arr.length - 1 ? 'fade-in' : undefined}
              style={{ display: 'flex', gap: '12px', alignItems: 'baseline' }}
            >
              <span style={{ color: C.ink4, width: '64px', flex: 'none' }}>{l.t}</span>
              <span style={{ color: i === arr.length - 1 ? C.ink : C.ink3 }}>
                {l.body}
                {i === arr.length - 1 && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: '7px',
                      height: '13px',
                      background: C.accent,
                      marginLeft: '4px',
                      transform: 'translateY(2px)',
                      animation: 'blink 1s steps(2, start) infinite',
                    }}
                  />
                )}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function UploadScreen({ onResult }: UploadScreenProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function loadFile(file: File | null) {
    setError(null);
    setSelectedFile(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    loadFile(e.target.files?.[0] ?? null);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) loadFile(f);
  }

  async function handleGenerate() {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('image', selectedFile);
      const res = await fetch('/api/generate', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? 'Request failed');
      onResult(
        data.manim_code,
        data.explanation ?? '',
        data.confidence_score ?? null,
        data.confidence_reason ?? '',
        data.confidence_flag ?? false,
        data.concept_name ?? null,
        data.resource_url ?? null,
        data.resource_title ?? null,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && selectedFile && !loading) {
        e.preventDefault();
        handleGenerate();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile, loading]);

  const fileSizeKb = selectedFile ? Math.round(selectedFile.size / 1024) : 0;
  const fileType = selectedFile ? selectedFile.type.split('/')[1] || 'file' : '';

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
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 0',
        }}
      >
        <div
          style={{
            width: 'min(640px, 100%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '36px',
          }}
        >
          {/* Lockup */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                fontFamily: C.mono,
                fontSize: '10.5px',
                color: C.ink4,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
              }}
            >
              vol·i &nbsp;//&nbsp; manim · ai
            </div>
            <h1
              style={{
                fontFamily: C.mono,
                fontWeight: 500,
                fontSize: '48px',
                lineHeight: 1,
                letterSpacing: '-.015em',
                color: C.ink,
                margin: 0,
              }}
            >
              <span style={{ color: C.ink3, fontWeight: 400 }}>[</span>
              manim
              <span style={{ color: C.accent }}>·</span>
              ai
              <span style={{ color: C.ink3, fontWeight: 400 }}>]</span>
            </h1>
            <p
              style={{
                fontFamily: C.mono,
                fontSize: '13px',
                color: C.ink2,
                maxWidth: '540px',
                marginTop: '6px',
                lineHeight: 1.5,
              }}
            >
              Upload a screenshot of any mathematical concept. Claude reads it, drafts a Manim
              scene, and renders a short, typeset animation in the lineage of{' '}
              <span style={{ color: C.ink, borderBottom: `1px solid ${C.rule2}`, paddingBottom: '1px' }}>
                3Blue1Brown
              </span>
              .
            </p>
          </div>

          {/* Dropzone */}
          {!loading && (
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={e => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
              }}
              style={{
                position: 'relative',
                background: C.panel,
                border: `1px ${selectedFile ? 'solid' : 'dashed'} ${dragging ? C.accent : C.rule2}`,
                padding: selectedFile ? '18px' : '48px 32px',
                cursor: 'pointer',
                transition: 'border-color .15s, background-color .15s',
                outline: 'none',
              }}
              onMouseEnter={e => {
                if (!selectedFile) (e.currentTarget as HTMLDivElement).style.borderColor = C.accent;
              }}
              onMouseLeave={e => {
                if (!selectedFile && !dragging)
                  (e.currentTarget as HTMLDivElement).style.borderColor = C.rule2;
              }}
            >
              {selectedFile && preview ? (
                <div style={{ display: 'flex', gap: '14px', alignItems: 'stretch' }}>
                  <div
                    style={{
                      width: '104px',
                      height: '72px',
                      flex: 'none',
                      background: '#070b0e',
                      border: `1px solid ${C.rule}`,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={preview}
                      alt={selectedFile.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '2px 0',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: C.ink,
                          fontSize: '13px',
                          fontFamily: C.mono,
                        }}
                      >
                        {selectedFile.name}
                      </div>
                      <div
                        style={{
                          color: C.ink3,
                          fontSize: '11px',
                          letterSpacing: '.06em',
                          fontFamily: C.mono,
                          marginTop: '2px',
                        }}
                      >
                        {fileSizeKb} kb · {fileType}
                      </div>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        inputRef.current?.click();
                      }}
                      style={{
                        alignSelf: 'flex-start',
                        color: C.accent,
                        fontSize: '11px',
                        letterSpacing: '.14em',
                        textTransform: 'uppercase',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        fontFamily: C.mono,
                      }}
                    >
                      [replace]
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  <BracketUploadIcon />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      color: C.ink,
                      fontSize: '13px',
                      fontFamily: C.mono,
                    }}
                  >
                    <span style={{ color: C.ink2 }}>drop screenshot</span>
                    <span style={{ ...META, fontSize: '11px', color: C.ink4 }}>or</span>
                    <span
                      style={{
                        border: `1px solid ${C.rule2}`,
                        padding: '6px 12px',
                        fontSize: '11px',
                        letterSpacing: '.12em',
                        textTransform: 'uppercase',
                        color: C.ink,
                        background: 'transparent',
                        fontFamily: C.mono,
                      }}
                    >
                      browse files
                    </span>
                  </div>
                </div>
              )}

              {!selectedFile && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: C.ink4,
                    fontSize: '10.5px',
                    letterSpacing: '.16em',
                    textTransform: 'uppercase',
                    marginTop: '18px',
                    borderTop: `1px solid ${C.rule}`,
                    paddingTop: '12px',
                    fontFamily: C.mono,
                  }}
                >
                  <span>png · jpg · pdf page</span>
                  <span>≤ 10 mb</span>
                  <span>local · not stored</span>
                </div>
              )}

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* Submit */}
          {selectedFile && !loading && (
            <button
              onClick={handleGenerate}
              style={{
                appearance: 'none',
                border: 'none',
                cursor: 'pointer',
                background: C.accent,
                color: '#06121d',
                fontFamily: C.mono,
                fontWeight: 600,
                fontSize: '12px',
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                padding: '14px 16px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'background .15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = C.accent2;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = C.accent;
              }}
            >
              <span>▶</span>
              <span>generate animation</span>
              <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'rgba(6,18,29,.5)', letterSpacing: '.18em' }}>
                ⌘ ⏎
              </span>
            </button>
          )}

          {/* Loader */}
          {loading && <LiveLogLoader />}

          {/* Error */}
          {error && !loading && (
            <div
              style={{
                border: '1px solid #5a2a26',
                background: 'rgba(120,40,32,.10)',
                color: '#e9a48f',
                padding: '14px 16px',
                fontFamily: C.mono,
                fontSize: '12px',
                lineHeight: 1.6,
              }}
            >
              <div style={{ color: C.bad, fontWeight: 500, letterSpacing: '.06em' }}>
                <span style={{ color: C.bad }}>[err] </span>
                request failed
              </div>
              <div style={{ color: '#a07b6f', marginTop: '4px' }}>{error}</div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
