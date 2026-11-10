import { ChangeEvent, useState } from 'react';
import { api, ApiError, upload } from '../api';
import { useAuth } from '../auth';
import { CITIES, CREW_ROLES } from '../options';
import { Bio, ProfileData } from '../types';
import Avatar from './Avatar';
import ChipSelect from './ChipSelect';
import RoleIcon from './RoleIcons';
import ProfileBanner from './ProfileBanner';
import SaveBar from './SaveBar';

export default function BasicTab({ profile, bio, onSaved, identity, base = '/me' }: { profile: ProfileData; bio: Bio; onSaved: (p: ProfileData, b: Bio) => void; identity: { name: string; avatar_url: string | null }; base?: string }) {
  const { refresh } = useAuth();
  const [nickname, setNickname] = useState(identity.name);
  const [username, setUsername] = useState(profile.username ?? '');
  const [roles, setRoles] = useState<string[]>(profile.crew_roles ?? []);
  const [text, setText] = useState(profile.bio);
  const [links, setLinks] = useState<string[]>(profile.links);
  const [loc, setLoc] = useState(bio.location);
  const [avatar, setAvatar] = useState(identity.avatar_url);
  const [banner, setBanner] = useState<string | null>(profile.banner_url ?? null);
  const [bannerBusy, setBannerBusy] = useState(false);
  const [note, setNote] = useState('');

  function locate() {
    if (!navigator.geolocation) return setNote('Geolocation is not supported by this browser.');
    navigator.geolocation.getCurrentPosition(
      (p) => { setNote(''); setLoc((l) => ({ ...l, lat: p.coords.latitude, lng: p.coords.longitude })); },
      () => setNote('Could not get your location. Allow location access for this site in the browser.'));
  }

  async function pickFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return setNote('Image is too large (max 2 MB).');
    try { const r = await upload<{ avatar_url: string }>(`${base}/avatar`, 'avatar', f); setAvatar(r.avatar_url); setNote(''); await refresh(); }
    catch (err) { setNote(err instanceof ApiError ? err.message : 'Upload failed'); }
  }
  async function removeAvatar() { await api(`${base}/avatar`, { method: 'DELETE' }); setAvatar(null); await refresh(); }

  // Banner: saved on the server immediately (upload / replace / remove), so it is still there after a refresh or a new login.
  async function pickBanner(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) return setNote('Banner is too large (max 4 MB).');
    setBannerBusy(true);
    try { const r = await upload<{ banner_url: string }>(`${base}/banner`, 'banner', f); setBanner(r.banner_url); setNote(''); }
    catch (err) { setNote(err instanceof ApiError ? err.message : 'Banner upload failed'); }
    finally { setBannerBusy(false); }
  }
  async function removeBanner() {
    setBannerBusy(true);
    try { await api(`${base}/banner`, { method: 'DELETE' }); setBanner(null); setNote(''); }
    catch { setNote('Could not remove the banner.'); }
    finally { setBannerBusy(false); }
  }

  async function save() {
    const p = await api<ProfileData>(`${base}/profile`, { method: 'PUT', body: { nickname: nickname.trim(), username: username.trim().replace(/^@/, ''), crew_roles: roles, bio: text.trim(), links: links.map((l) => l.trim()).filter(Boolean) } });
    let b = bio;
    if (loc.lat !== null && loc.lng !== null) {
      b = await api<Bio>(`${base}/bio`, { method: 'PUT', body: { location: { city: loc.city?.trim() || undefined, lat: loc.lat, lng: loc.lng, radius_km: Number(loc.radius_km) } } });
    }
    onSaved(p, b);
    await refresh();
  }

  return (
    <div className="card stack">
      <div className="banner-edit-block">
        <ProfileBanner src={banner} />
        <div className="row banner-actions">
          <label className="btn">{bannerBusy ? 'Working…' : banner ? 'Replace banner' : 'Upload banner'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickBanner} disabled={bannerBusy} hidden /></label>
          {banner && <button type="button" className="btn ghost" disabled={bannerBusy} onClick={removeBanner}>Remove banner</button>}
          <small className="muted">Wide image (about 1200×400). PNG, JPEG or WebP, up to 4 MB.</small>
        </div>
      </div>

      <div className="avatar-edit">
        <Avatar src={avatar} size={88} />
        <div className="stack-sm">
          <label className="btn">Upload picture<input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickFile} hidden /></label>
          {avatar && <button type="button" className="btn ghost" onClick={removeAvatar}>Remove</button>}
          <small className="muted">PNG, JPEG or WebP, up to 2 MB.</small>
        </div>
      </div>

      <div className="grid-2">
        <label>Display name<input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={30} /></label>
        <label>Username <small className="muted">(your @handle, optional)</small><input value={username} placeholder="e.g. night_owl" onChange={(e) => setUsername(e.target.value)} maxLength={21} autoCapitalize="none" /></label>
      </div>
      <div className="stack-sm">
        <span className="muted small">Your role in the crew (pick one or more)</span>
        <ChipSelect options={CREW_ROLES.map((r) => r.key)} value={roles} onChange={setRoles} label={(k) => CREW_ROLES.find((r) => r.key === k)?.label ?? k} icon={(k) => <RoleIcon role={k} size={16} />} />
      </div>
      <label>About me<textarea rows={4} value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder="A few lines about you…" /></label>

      <div className="stack-sm">
        <span className="muted small">Links (optional)</span>
        {links.map((l, i) => (
          <div className="row" key={i}>
            <input value={l} placeholder="https://…" onChange={(e) => setLinks(links.map((x, j) => (j === i ? e.target.value : x)))} />
            <button type="button" className="btn ghost" onClick={() => setLinks(links.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        {links.length < 5 && <button type="button" className="btn ghost" onClick={() => setLinks([...links, ''])}>+ Add link</button>}
      </div>

      <h3>Location</h3>
      <p className="muted small">Used only to match you with people near you. Other users see just your city, never your coordinates.</p>
      <div className="row">
        <button type="button" className="btn" onClick={locate}>📍 Use my current location</button>
        <span className="muted small">{loc.lat !== null && loc.lng !== null ? `Saved point: ${loc.lat.toFixed(2)}, ${loc.lng.toFixed(2)}` : 'No location set yet'}</span>
      </div>
      <label>No GPS? Pick a city instead
        <select value="" onChange={(e) => { const c = CITIES.find((x) => x.name === e.target.value); if (c) setLoc({ ...loc, city: c.name, lat: c.lat, lng: c.lng }); }}>
          <option value="">Choose a city…</option>{CITIES.map((c) => <option key={c.name}>{c.name}</option>)}
        </select>
      </label>
      <div className="grid-2">
        <label>City (shown to others)<input value={loc.city ?? ''} maxLength={60} onChange={(e) => setLoc({ ...loc, city: e.target.value })} /></label>
        <label>Maximum distance (km)<input type="number" min={1} max={20000} value={loc.radius_km} onChange={(e) => setLoc({ ...loc, radius_km: Number(e.target.value) })} /></label>
      </div>
      {note && <div className="error">{note}</div>}
      <SaveBar action={save} />
    </div>
  );
}
