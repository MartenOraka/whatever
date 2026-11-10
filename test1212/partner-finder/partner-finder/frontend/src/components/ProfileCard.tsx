import type { CSSProperties } from 'react';
import { imageUrl } from '../api';
import { pretty } from '../options';
import { CardData, Creative, Gaming, Mode } from '../types';
import Avatar from './Avatar';
import CrewRoleBadges from './CrewRoleBadges';
import GameArtwork from './GameArtwork';
import ToolArtwork from './ToolArtwork';

// A user's own banner (if any) sits under the card label; the default gradient stays underneath as a fallback layer.
const bannerStyle = (url: string | null | undefined): CSSProperties | undefined => url ? {
  backgroundImage: `linear-gradient(180deg,rgba(8,11,18,.1),rgba(8,11,18,.5)), url("${imageUrl(url)}"), linear-gradient(110deg,#292348,#1c3446 90%)`,
  backgroundSize: 'cover', backgroundPosition: 'center',
} : undefined;

function Chips({ items, limit = 4 }: { items: string[]; limit?: number }) {
  if (!items.length) return null;
  return <div className="chips compact-chips">{items.slice(0, limit).map((item) => <span key={item} className="chip static">{item}</span>)}</div>;
}

function GamingSummary({ data, compact = false }: { data: Gaming; compact?: boolean }) {
  const games = data.games.slice(0, compact ? 3 : 6);
  return <div className="pcard-summary">
    {games.length > 0 && <div className="pcard-section"><div className="section-label">GAMES</div><GameArtwork games={games} limit={compact ? 3 : 6} compact={compact} /></div>}
    {data.platforms && data.platforms.length > 0 && <div className="pcard-section"><div className="section-label">PLATFORMS</div><Chips items={data.platforms} /></div>}{data.modes.length > 0 && <div className="pcard-section"><div className="section-label">PLAYSTYLE</div><Chips items={data.modes} limit={3} /></div>}
  </div>;
}

function CreativeSummary({ data, compact = false }: { data: Creative; compact?: boolean }) {
  const skills = data.skills.length ? data.skills : data.interests;
  return <div className="pcard-summary">
    {skills.length > 0 && <div className="pcard-section"><div className="section-label">SKILLS</div><Chips items={skills} limit={compact ? 4 : 7} /> </div>}
    <ToolArtwork tools={data.tools} limit={compact ? 3 : 6} compact={compact} />
    {data.roles.length > 0 && <div className="pcard-section"><div className="section-label">OPEN TO</div><Chips items={data.roles} limit={compact ? 3 : 5} /></div>}
  </div>;
}

export function GamingDetails({ g }: { g: Gaming }) {
  return <><GamingSummary data={g} />{g.goals.length > 0 && <div className="pcard-section"><div className="section-label">GOALS</div><Chips items={g.goals} /></div>}{g.availability.length > 0 && <div className="pcard-section"><div className="section-label">AVAILABILITY</div><Chips items={g.availability.map(pretty)} /></div>}{g.tags.length > 0 && <div className="pcard-section"><div className="section-label">TAGS</div><Chips items={g.tags} /></div>}</>;
}

export function CreativeDetails({ c }: { c: Creative }) {
  return <><CreativeSummary data={c} />{c.experience && <div className="pcard-section"><div className="section-label">EXPERIENCE</div><Chips items={[c.experience]} /></div>}{c.goals.length > 0 && <div className="pcard-section"><div className="section-label">GOALS</div><Chips items={c.goals} /></div>}{c.tags.length > 0 && <div className="pcard-section"><div className="section-label">TAGS</div><Chips items={c.tags} /></div>}</>;
}

export default function ProfileCard({ card, mode }: { card: CardData; mode: Mode }) {
  const reasons = card.why.reasons.slice(0, 2);
  return <div className={`card pcard pcard-${mode}`}>
    <div className="pcard-banner" style={bannerStyle(card.banner_url)}><span>{mode === 'gaming' ? 'GAMING PARTNER' : 'CREATIVE COLLABORATOR'}</span><span className="pcard-banner-mark">✳</span></div>
    <div className="pcard-content">
      <div className="pcard-head"><Avatar src={card.avatar_url} size={76} /><div className="grow pcard-identity"><h2>{card.name}</h2>{card.username && <span className="handle">@{card.username}</span>}<span className="muted">⌖ {card.bio.location.city ?? 'Location not shared'}</span></div><div className="match-score"><strong>{card.why.score}</strong><span>MATCH</span></div></div>
      <CrewRoleBadges roles={card.crew_roles} />
      {card.about && <p className="pcard-about">{card.about}</p>}
      {mode === 'gaming' ? <GamingSummary data={card.bio.gaming} compact /> : <CreativeSummary data={card.bio.creative} compact />}
      {reasons.length > 0 && <div className="pcard-why"><span>WHY THIS COULD WORK</span><p>{reasons.join(' · ')}</p></div>}
    </div>
  </div>;
}
