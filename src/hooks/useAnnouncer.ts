import { useCallback, useRef, useState } from 'react';

/** Feeds a polite aria-live region; repeated identical messages are still announced. */
export function useAnnouncer() {
  const [message, setMessage] = useState('');
  const timer = useRef<number | undefined>(undefined);

  const announce = useCallback((text: string) => {
    window.clearTimeout(timer.current);
    setMessage('');
    timer.current = window.setTimeout(() => setMessage(text), 60);
  }, []);

  return { message, announce };
}
