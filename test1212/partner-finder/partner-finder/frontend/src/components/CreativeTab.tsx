import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import Priorities from './Priorities';
import { C_GOALS, C_TAGS, CREATIVE_FACTORS, EXPERIENCE, INTERESTS, ROLES, SKILLS, TOOLS } from '../options';
import { Bio } from '../types';
import { findToolIcon } from '../toolIcons';
import ChipSelect from './ChipSelect';
import ToolArtwork, { ToolIcon } from './ToolArtwork';
import SaveBar from './SaveBar';

export default function CreativeTab({ bio, onSaved, base = '/me' }: { bio: Bio; onSaved: (b: Bio) => void; base?: string }) {
  const { refresh } = useAuth();
  const c = bio.creative;
  const [skills, setSkills] = useState(c.skills);
  const [interests, setInterests] = useState(c.interests);
  const [tools, setTools] = useState(c.tools);
  const [experience, setExperience] = useState(c.experience ?? '');
  const [roles, setRoles] = useState(c.roles);
  const [goals, setGoals] = useState(c.goals);
  const [tags, setTags] = useState(c.tags);
  const [prefs, setPrefs] = useState<Record<string, string>>(bio.preferences?.creative ?? {});

  async function save() {
    const b = await api<Bio>(`${base}/bio`, { method: 'PUT', body: { creative: { skills, interests, tools, roles, goals, tags, experience: experience || null }, preferences: { creative: prefs } } });
    onSaved(b);
    await refresh();
  }

  return (
    <div className="card stack">
      <h3>Skills</h3><ChipSelect options={SKILLS} value={skills} onChange={setSkills} allowCustom />
      <h3>Interests</h3><ChipSelect options={INTERESTS} value={interests} onChange={setInterests} allowCustom />
      <h3>Software and tools</h3>
      <ChipSelect options={TOOLS} value={tools} onChange={setTools} allowCustom icon={(s) => (findToolIcon(s) ? <ToolIcon name={s} size={16} /> : null)} />
      <ToolArtwork tools={tools} limit={12} compact />
      <label>Experience level
        <select value={experience} onChange={(e) => setExperience(e.target.value)}>
          <option value="">Not set</option>{EXPERIENCE.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </label>
      <h3>Roles I am looking for in a collaborator</h3><ChipSelect options={ROLES} value={roles} onChange={setRoles} />
      <h3>Personal goals</h3><ChipSelect options={C_GOALS} value={goals} onChange={setGoals} allowCustom />
      <h3>Tags</h3><ChipSelect options={C_TAGS} value={tags} onChange={setTags} />
      <h3>What matters most in a match</h3>
      <p className="muted small">Choose which data points count more or less when we rank people for you.</p>
      <Priorities factors={CREATIVE_FACTORS} value={prefs} onChange={setPrefs} />
      <SaveBar action={save} />
    </div>
  );
}
