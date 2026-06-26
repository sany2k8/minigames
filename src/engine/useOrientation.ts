import { useEffect, useState } from 'react';

/** Returns 'landscape' when wide enough for side-by-side split, else 'portrait'. */
export function useOrientation(): 'portrait' | 'landscape' {
  const get = () => (window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait');
  const [o, setO] = useState<'portrait' | 'landscape'>(get);
  useEffect(() => {
    const on = () => setO(get());
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
    };
  }, []);
  return o;
}
