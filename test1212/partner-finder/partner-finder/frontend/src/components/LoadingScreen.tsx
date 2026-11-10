import Logo from './Logo';

// Full-screen loading state with the QREW icon.
export default function LoadingScreen({ label = 'Loading' }: { label?: string }) {
  return <div className="loading-screen" role="status" aria-live="polite"><Logo variant="icon" /><span>{label}…</span></div>;
}
