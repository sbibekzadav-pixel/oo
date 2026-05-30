import { useRef, useCallback, useState, useEffect } from 'react';

/**
 * Web Speech API hook (same approach as VoiceSearchModal).
 * On native builds without SpeechRecognition, returns isSupported: false.
 */
export function useWebSpeechToText(speechLang = 'en-US') {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const onResultRef = useRef(null);

  const stop = useCallback(() => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        /* ignore */
      }
      recognitionRef.current = null;
    }
  }, []);

  const start = useCallback((onResult) => {
    stop();
    setError(null);
    onResultRef.current = onResult;

    const SpeechRecognition = typeof window !== 'undefined'
      && (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setError('unsupported');
      return false;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = speechLang;

      rec.onstart = () => setIsListening(true);

      rec.onresult = (e) => {
        let interim = '';
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; i += 1) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript;
          else interim += e.results[i][0].transcript;
        }
        const text = (final || interim).trim();
        if (text && onResultRef.current) onResultRef.current(text, Boolean(final));
      };

      rec.onerror = (e) => {
        setError(e.error || 'error');
        setIsListening(false);
      };

      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
      rec.start();
      return true;
    } catch (err) {
      setError('start_failed');
      setIsListening(false);
      return false;
    }
  }, [speechLang, stop]);

  useEffect(() => () => stop(), [stop]);

  const isSupported = typeof window !== 'undefined'
    && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  return { isListening, error, isSupported, start, stop };
}
