'use client';

interface ResultScreenProps {
  manim_code: string;
  onReset: () => void;
}

function getVideoSrc(code: string): string {
  if (/continuity|continuous/i.test(code)) return '/animations/continuity.mp4';
  if (/differentiab/i.test(code)) return '/animations/differentiability.mp4';
  return '/animations/continuity.mp4';
}

export default function ResultScreen({ manim_code, onReset }: ResultScreenProps) {
  const videoSrc = getVideoSrc(manim_code);

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
          <div className="flex-1 bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center min-h-64">
            <video
              key={videoSrc}
              src={videoSrc}
              controls
              autoPlay
              muted
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
        </div>
      </div>

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
