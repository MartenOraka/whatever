import { useState } from 'react';
import { ApiError } from '../api';

// Save button with busy / "Saved" / error feedback.
export default function SaveBar({ action }: { action: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function click() {
    setBusy(true); setErr(''); setMsg('');
    try { await action(); setMsg('Saved ✓'); setTimeout(() => setMsg(''), 2500); }
    catch (e) { setErr(e instanceof ApiError ? e.message : 'Could not save'); }
    finally { setBusy(false); }
  }
  return (
    <div className="savebar">
      <button type="button" className="btn primary" disabled={busy} onClick={click}>{busy ? 'Saving…' : 'Save'}</button>
      {msg && <span className="ok">{msg}</span>}
      {err && <span className="error">{err}</span>}
    </div>
  );
}
