'use client';

import { useState } from 'react';

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

function getVideoSrc(code: string): string {
  if (/continuity|continuous/i.test(code)) return '/animations/continuity.mp4';
  if (/differentiab/i.test(code)) return '/animations/differentiability.mp4';
  return '/animations/continuity.mp4';
}

function ConfidenceWidget({
  confidenceScore,
  confidenceReason,
}: {
  confidenceScore: number | null;
  confidenceReason: string;
  confidenceFlag: boolean;
}) {
  const [popupOpen, setPopupOpen] = useState(false);

  if (confidenceScore === null) return null;

  const pct = ((confidenceScore - 1) / 4) * 100;

  const colorFill =
    confidenceScore <= 2 ? 'bg-red-400' :
    confidenceScore === 3 ? 'bg-yellow-400' :
    'bg-green-400';

  const colorText =
    confidenceScore <= 2 ? 'text-red-400' :
    confidenceScore === 3 ? 'text-yellow-400' :
    'text-green-400';

  return (
    <div className="flex flex-col gap-3 bg-zinc-900 rounded-xl p-4">
      <div className="flex items-center gap-1.5">
        <span className="text-zinc-400 text-sm font-medium">Animation Confidence</span>
        <div className="relative">
          <button
            onClick={() => setPopupOpen(true)}
            className="w-5 h-5 rounded-full bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs flex items-center justify-center transition-colors"
            aria-label="How this score is calculated"
          >
            ⓘ
          </button>
          {popupOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setPopupOpen(false)} />
              <div className="absolute z-20 bottom-full left-0 mb-2 w-72 bg-white rounded-xl shadow-xl p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-zinc-900">How this score is calculated</h3>
                  <button
                    onClick={() => setPopupOpen(false)}
                    className="text-zinc-400 hover:text-zinc-600 text-xl leading-none shrink-0"
                  >
                    ×
                  </button>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  After generating the animation, Claude runs a second review pass. It re-reads the original screenshot, the generated Manim code, and the explanation, then estimates how accurately the code represents the concept shown. The score reflects Claude&apos;s assessment of its own output — it is not a mathematical proof of correctness, and it does not execute the code. A score of 4 or 5 means the code appears consistent with the screenshot. A score of 3 or below means there may be a mismatch worth verifying with a textbook or teacher.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="relative h-5">
          <span
            className={`absolute -translate-x-1/2 text-xs font-bold ${colorText}`}
            style={{ left: `${pct}%` }}
          >
            {confidenceScore.toFixed(1)}
          </span>
        </div>

        <div className="relative h-2 bg-zinc-700 rounded-full">
          <div
            className={`absolute left-0 top-0 h-full rounded-full ${colorFill}`}
            style={{ width: `${pct}%` }}
          />
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-zinc-900 ${colorFill}`}
            style={{ left: `${pct}%` }}
          />
        </div>

        <div className="flex justify-between mt-1">
          <span className="text-zinc-500 text-xs">Low confidence</span>
          <span className="text-zinc-500 text-xs">High confidence</span>
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-zinc-500 text-xs">Claude&apos;s assessment:</span>
        <p className="text-zinc-400 text-xs italic">{confidenceReason}</p>
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
    <div className="border-l-4 border-blue-500 bg-slate-800/60 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-zinc-400 text-xs">Claude identified this concept as:</span>
        <p className="text-white text-sm font-medium">{conceptName}</p>
      </div>

      {!resourceUrl ? (
        <p className="text-zinc-500 text-xs">
          Claude identified concept as {conceptName}. No verified reference found for this topic.
        </p>
      ) : (
        <>
          <div className="border-t border-zinc-700" />
          <div className="flex flex-col gap-1.5">
            <span className="text-zinc-400 text-xs">Cross-check with a verified source:</span>
            <a
              href={resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              {resourceTitle} →
            </a>
            <p className="text-zinc-500 text-xs italic">
              Results from Khan Academy, MIT OpenCourseWare, Paul&apos;s Online Math Notes, or 3Blue1Brown only.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default function ResultScreen({ manim_code, explanation, confidenceScore, confidenceReason, confidenceFlag, conceptName, resourceUrl, resourceTitle, onReset }: ResultScreenProps) {
  const originalVideoUrl = getVideoSrc(manim_code);

  const [clarifications, setClarifications] = useState<Clarification[]>([]);
  const [followUp, setFollowUp] = useState('');
  const [clarifyLoading, setClarifyLoading] = useState(false);
  const [clarifyError, setClarifyError] = useState<string | null>(null);

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

      console.log('[render] Sending script to renderer. First 100 chars:', clarification_code.slice(0, 100));

      const renderRes = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manim_code: clarification_code, scene_name: 'ClarificationScene' }),
      });
      const renderData = await renderRes.json();

      console.log('[render] Full render response:', renderData);

      if (!renderRes.ok || renderData.error) {
        throw new Error(renderData.error ?? 'Render failed');
      }

      const clarificationVideoUrl: string = renderData.video_url;

      if (!clarificationVideoUrl) {
        throw new Error('Render succeeded but no video URL in response');
      }

      setClarifications((prev) => [
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

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col px-6 py-10 gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="flex flex-col gap-3">
          <h2 className="text-white text-xl font-semibold">Generated Manim Code</h2>
          <p className="text-zinc-400 text-sm">
            Claude analyzed your screenshot and generated this animation code.
          </p>
          <pre className="flex-1 bg-zinc-900 rounded-xl p-4 overflow-auto text-sm font-mono text-green-300 whitespace-pre-wrap break-words max-h-[70vh]">
            {manim_code}
          </pre>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-white text-xl font-semibold">Animation Preview</h2>
          <p className="text-zinc-400 text-sm">Pre-rendered output of this concept.</p>
          <div className="bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center min-h-64">
            <video
              key={originalVideoUrl}
              src={originalVideoUrl}
              controls
              autoPlay
              muted
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          <ConfidenceWidget
            confidenceScore={confidenceScore}
            confidenceReason={confidenceReason}
            confidenceFlag={confidenceFlag}
          />

          <SourceCard
            conceptName={conceptName}
            resourceUrl={resourceUrl}
            resourceTitle={resourceTitle}
          />

          <div className="flex flex-col gap-2">
            <label className="text-zinc-300 text-sm font-medium">
              What&apos;s unclear? Ask for a deeper explanation.
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. explain the limit step in more detail"
                disabled={clarifyLoading}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
              />
              <button
                onClick={handleClarify}
                disabled={!followUp.trim() || clarifyLoading}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                {clarifyLoading ? 'Rendering…' : 'Explain'}
              </button>
            </div>
            {clarifyError && (
              <p className="text-red-400 text-xs">{clarifyError}</p>
            )}
          </div>
        </div>
      </div>

      {clarifications.length > 0 && (
        <div className="flex flex-col gap-6">
          <h2 className="text-white text-xl font-semibold">Clarifications</h2>
          {clarifications.map((c, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-900 text-blue-300">
                  Clarification {i + 1}
                </span>
                <p className="text-zinc-300 text-sm italic">&ldquo;{c.question}&rdquo;</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <pre className="bg-zinc-900 rounded-xl p-4 overflow-auto text-sm font-mono text-green-300 whitespace-pre-wrap break-words max-h-72">
                  {c.manim_code}
                </pre>
                <div className="bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center min-h-48">
                  <video
                    key={c.video_url}
                    src={c.video_url}
                    controls
                    autoPlay
                    muted
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={onReset}
          className="px-8 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-colors"
        >
          Try Another
        </button>
      </div>
    </div>
  );
}
