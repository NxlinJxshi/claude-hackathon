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
  const [conceptName, setConceptName] = useState<string | null>(null);
  const [resourceUrl, setResourceUrl] = useState<string | null>(null);
  const [resourceTitle, setResourceTitle] = useState<string | null>(null);

  function handleResult(
    code: string,
    exp: string,
    score: number | null,
    reason: string,
    flag: boolean,
    concept: string | null,
    url: string | null,
    title: string | null,
  ) {
    setManimCode(code);
    setExplanation(exp);
    setConfidenceScore(score);
    setConfidenceReason(reason);
    setConfidenceFlag(flag);
    setConceptName(concept);
    setResourceUrl(url);
    setResourceTitle(title);
    setState('result');
  }

  function handleReset() {
    setManimCode('');
    setExplanation('');
    setConfidenceScore(null);
    setConfidenceReason('');
    setConfidenceFlag(false);
    setConceptName(null);
    setResourceUrl(null);
    setResourceTitle(null);
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
        conceptName={conceptName}
        resourceUrl={resourceUrl}
        resourceTitle={resourceTitle}
        onReset={handleReset}
      />
    );
  }

  return <UploadScreen onResult={handleResult} />;
}
