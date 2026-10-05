'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ------------------------------------------------------------
// Voice-first counselling helpers (browser Web Speech API).
// If the browser or permission model does not support speech,
// callers show a text-based fallback — never a dead button.
// ------------------------------------------------------------

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => SpeechRecognitionLike) | null;
}

export function speechRecognitionSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export function speechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export interface UseSpeechRecognitionOptions {
  lang: 'en-IN' | 'hi-IN';
  onResult: (transcript: string) => void;
}

export function useSpeechRecognition({ lang, onResult }: UseSpeechRecognitionOptions) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    setSupported(speechRecognitionSupported());
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      setError('Speech input is not available in this browser. Please type your message instead.');
      return;
    }
    setError(null);
    try {
      const rec = new Ctor();
      rec.lang = lang;
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = (event) => {
        const last = event.results[event.results.length - 1];
        const transcript = last?.[0]?.transcript ?? '';
        if (transcript) onResultRef.current(transcript);
      };
      rec.onerror = (event) => {
        const code = event.error ?? 'unknown';
        if (code === 'not-allowed' || code === 'service-not-allowed') {
          setError('Microphone permission was denied. You can type your message instead.');
        } else if (code !== 'aborted') {
          setError('Could not hear you clearly. Please try again or type your message.');
        }
        setListening(false);
      };
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      setError('Could not start speech input. Please type your message instead.');
      setListening(false);
    }
  }, [lang]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, supported, error, start, stop };
}

export interface UseSpeechSynthesis {
  supported: boolean;
  speaking: boolean;
  speak: (text: string, lang?: 'en-IN' | 'hi-IN') => void;
  stop: () => void;
}

export function useSpeechSynthesis(): UseSpeechSynthesis {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(speechSynthesisSupported());
    return () => {
      if (speechSynthesisSupported()) window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text: string, lang: 'en-IN' | 'hi-IN' = 'en-IN') => {
    if (!speechSynthesisSupported()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[•\n]+/g, '. '));
    utterance.lang = lang;
    utterance.rate = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (speechSynthesisSupported()) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { supported, speaking, speak, stop };
}
