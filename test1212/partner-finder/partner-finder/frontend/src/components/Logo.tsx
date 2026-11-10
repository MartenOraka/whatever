import { APP_NAME } from '../config';

// The QREW logo. One component, used everywhere, so the brand can never drift.
// full = crown + wordmark, icon = the Q app tile. Size is set per place in CSS (.qrew-logo).
export default function Logo({ variant = 'full' }: { variant?: 'full' | 'icon' }) {
  return <img className={`qrew-logo qrew-logo-${variant}`} src={variant === 'icon' ? '/brand/qrew-icon.png' : '/brand/qrew-logo.png'} alt={APP_NAME} draggable={false} />;
}
