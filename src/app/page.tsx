'use client';

import { useState } from 'react';
import UploadScreen from './components/UploadScreen';
import ResultScreen from './components/ResultScreen';

type AppState = 'upload' | 'result';

export default function Home() {
  const [state, setState] = useState<AppState>('upload');
  const [manimCode, setManimCode] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [confidenceReason, setConfidenceReason] = useState<string>('');
  const [confidenceFlag, setConfidenceFlag] = useState<boolean>(false);

  function handleResult(
    code: string,
    exp: string,
    score: number | null,
    reason: string,
    flag: boolean,
  ) {
    setManimCode(code);
    setExplanation(exp);
    setConfidenceScore(score);
    setConfidenceReason(reason);
    setConfidenceFlag(flag);
    setState('result');
  }

  function handleReset() {
    setManimCode('');
    setExplanation('');
    setConfidenceScore(null);
    setConfidenceReason('');
    setConfidenceFlag(false);
    setState('upload');
  }

  if (state === 'result') {
    return (
      <ResultScreen
        manim_code={manimCode}
        explanation={explanation}
        confidenceScore={confidenceScore}
        confidenceReason={confidenceReason}
        confidenceFlag={confidenceFlag}
        onReset={handleReset}
      />
    );
  }

  return <UploadScreen onResult={handleResult} />;
}
