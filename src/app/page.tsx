'use client';

import { useState } from 'react';
import UploadScreen from './components/UploadScreen';
import ResultScreen from './components/ResultScreen';

type AppState = 'upload' | 'result';

export default function Home() {
  const [state, setState] = useState<AppState>('upload');
  const [manimCode, setManimCode] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');

  function handleResult(code: string, exp: string) {
    setManimCode(code);
    setExplanation(exp);
    setState('result');
  }

  function handleReset() {
    setManimCode('');
    setExplanation('');
    setState('upload');
  }

  if (state === 'result') {
    return <ResultScreen manim_code={manimCode} explanation={explanation} onReset={handleReset} />;
  }

  return <UploadScreen onResult={handleResult} />;
}
