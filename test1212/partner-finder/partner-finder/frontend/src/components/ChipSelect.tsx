import { ReactNode, useState } from 'react';

interface Props {
  options: string[]; value: string[]; onChange: (v: string[]) => void;
  label?: (s: string) => string; allowCustom?: boolean;
  icon?: (s: string) => ReactNode;          // optional small icon in front of the label (used for software/tools)
}

// Click chips to select. Custom values the user added are shown as chips too.
export default function ChipSelect({ options, value, onChange, label = (s) => s, allowCustom, icon }: Props) {
  const [draft, setDraft] = useState('');
  const all = [...options, ...value.filter((v) => !options.includes(v))];
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o]);
  const add = () => {
    const t = draft.trim().slice(0, 40);
    if (t && !value.includes(t) && value.length < 20) onChange([...value, t]);
    setDraft('');
  };
  return (
    <div>
      <div className="chips">
        {all.map((o) => {
          const ico = icon?.(o);
          return (
            <button type="button" key={o} className={'chip' + (value.includes(o) ? ' on' : '') + (ico ? ' chip-with-icon' : '')} onClick={() => toggle(o)}>
              {ico && <span className="chip-icon">{ico}</span>}{label(o)}
            </button>
          );
        })}
      </div>
      {allowCustom && (
        <input className="chip-input" placeholder="Add your own, press Enter" value={draft}
          onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
      )}
    </div>
  );
}
