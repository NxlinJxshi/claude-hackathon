'use client';

import { useState } from 'react';

interface ResultScreenProps {
  manim_code: string;
  explanation: string;
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

export default function ResultScreen({ manim_code, explanation, onReset }: ResultScreenProps) {
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

          <div className="flex flex-col gap-2 mt-1">
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
