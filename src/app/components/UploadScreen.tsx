'use client';

import { useState, useRef } from 'react';

interface UploadScreenProps {
  onResult: (
    manim_code: string,
    explanation: string,
    confidence_score: number | null,
    confidence_reason: string,
    confidence_flag: boolean,
  ) => void;
}

export default function UploadScreen({ onResult }: UploadScreenProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setError(null);
    setSelectedFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
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

      if (!res.ok || data.error) {
        throw new Error(data.error ?? 'Request failed');
      }

      onResult(
        data.manim_code,
        data.explanation ?? '',
        data.confidence_score ?? null,
        data.confidence_reason ?? '',
        data.confidence_flag ?? false,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-xl flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white tracking-tight mb-3">ManimAI</h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Upload a screenshot of any math concept. We&apos;ll generate a visual explanation in
            the style of 3Blue1Brown.
          </p>
        </div>

        <div
          className="w-full border-2 border-dashed border-zinc-700 rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer hover:border-zinc-500 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {preview ? (
            <img
              src={preview}
              alt="Selected screenshot"
              className="max-h-64 rounded-xl object-contain"
            />
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>
              <p className="text-zinc-400 text-sm">Click to upload an image</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {selectedFile && !loading && (
          <button
            onClick={handleGenerate}
            className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg transition-colors"
          >
            Generate Animation
          </button>
        )}

        {loading && (
          <div className="text-zinc-300 text-center text-base animate-pulse">
            Analyzing your screenshot and generating Manim code...
          </div>
        )}

        {error && (
          <div className="w-full rounded-xl bg-red-950 border border-red-800 px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
