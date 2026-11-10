import { useEffect, useState } from 'react';
import { SLOGAN } from '../config';
import Logo from './Logo';

// Short logo animation, shown on the first visit only. Click to skip.
export default function Intro() {
  const [show, setShow] = useState(() => { try { return !localStorage.getItem('intro-seen'); } catch { return false; } });

  const done = () => { try { localStorage.setItem('intro-seen', '1'); } catch { /* ignore */ } setShow(false); };
  useEffect(() => { if (!show) return; const t = setTimeout(done, 1900); return () => clearTimeout(t); }, [show]);

  if (!show) return null;
  return (
    <div className="intro" onClick={done}>
      <div className="intro-logo-img"><Logo /></div>
      <div className="intro-slogan">{SLOGAN}</div>
    </div>
  );
}
