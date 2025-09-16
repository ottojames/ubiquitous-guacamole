import * as React from 'react';

/* CN:GUARDRAIL-FINAL-START */
let setToast: ((msg: string) => void) | null = null;

export function useToastController() {
  const [msg, _set] = React.useState<string>('');
  React.useEffect(() => {
    setToast = _set;
    return () => {
      setToast = null;
    };
  }, []);
  return msg;
}

export function toast(message: string) {
  setToast?.(message);
  setTimeout(() => setToast?.(''), 1200);
}
/* CN:GUARDRAIL-FINAL-END */
