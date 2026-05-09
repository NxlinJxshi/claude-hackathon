'use client';

import { useState } from 'react';
import UploadScreen from './components/UploadScreen';
import ResultScreen from './components/ResultScreen';

type AppState = 'upload' | 'result';

export default function Home() {
  const [state, setState] = useState<AppState>('upload');
  const [manimCode, setManimCode] = useState<string>('');

  function handleResult(code: string) {
    setManimCode(code);
    setState('result');
  }

  function handleReset() {
    setManimCode('');
    setState('upload');
  }

  if (state === 'result') {
    return <ResultScreen manim_code={manimCode} onReset={handleReset} />;
  }

  return <UploadScreen onResult={handleResult} />;
}
