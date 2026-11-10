import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import Avatar from '../components/Avatar';
import CrewRoleBadges from '../components/CrewRoleBadges';
import ProfileBanner from '../components/ProfileBanner';
import { CreativeDetails, GamingDetails } from '../components/ProfileCard';
import { Bio, ProfileData } from '../types';

export default function MyProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [bio, setBio] = useState<Bio | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api<ProfileData>('/me/profile'), api<Bio>('/me/bio')])
      .then(([p, b]) => { if (active) { setProfile(p); setBio(b); } })
      .catch(() => { if (active) setError('Could not load your profile.'); });
    return () => { active = false; };
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!user || !profile || !bio) return <p className="muted">Loading your profile…</p>;

  const links = profile.links.filter((link) => /^https?:\/\//i.test(link));
  const hasGaming = bio.gaming.games.length > 0 || bio.gaming.modes.length > 0 || bio.gaming.tags.length > 0;
  const hasCreative = bio.creative.skills.length > 0 || bio.creative.interests.length > 0 || bio.creative.tools.length > 0;

  return <div className="stack my-profile-page">
    <div className="my-profile-heading"><div><div className="section-kicker">YOUR PUBLIC VIEW</div><h1>My profile</h1><p className="muted">This is how other people see you on QREW.</p></div><Link className="btn primary" to="/profile/edit">✎ Edit profile</Link></div>
    {!user.profile_completed && <div className="card warn">Your profile is not complete yet. Add a short introduction and at least one Gaming or Creative detail to unlock recommendations.</div>}
    <section className="my-profile-hero">
      <ProfileBanner src={profile.banner_url ?? null} editLink="/profile/edit" />
      <div className="my-profile-identity"><Avatar src={user.avatar_url} size={88}/><div className="my-profile-name"><h2>{user.name}</h2>{profile.username && <span className="handle">@{profile.username}</span>}<span>⌖ {bio.location.city ?? 'Location not shared'}</span></div><span className={user.profile_completed ? 'profile-state complete' : 'profile-state'}>{user.profile_completed ? 'PROFILE READY' : 'INCOMPLETE'}</span></div>
      <CrewRoleBadges roles={profile.crew_roles} />
      <div className="my-profile-bio">{profile.bio || 'You have not added an introduction yet.'}</div>
      {links.length > 0 && <div className="my-profile-links">{links.map((link) => <a key={link} href={link} target="_blank" rel="noopener noreferrer">{link.replace(/^https?:\/\//i, '').replace(/\/$/, '')} ↗</a>)}</div>}
    </section>
    <div className="my-profile-sections">
      <section className="card my-profile-section"><div className="my-profile-section-head"><div><span className="section-kicker">01 / PLAY TOGETHER</span><h2>Gaming</h2></div><span className="section-pip gaming-pip">GAME</span></div>{hasGaming ? <GamingDetails g={bio.gaming}/> : <p className="muted">No gaming details added yet.</p>}</section>
      <section className="card my-profile-section"><div className="my-profile-section-head"><div><span className="section-kicker">02 / CREATE TOGETHER</span><h2>Creative</h2></div><span className="section-pip creative-pip">CREATE</span></div>{hasCreative ? <CreativeDetails c={bio.creative}/> : <p className="muted">No creative details added yet.</p>}</section>
    </div>
    <div className="my-profile-edit-bottom"><span>Want to change something?</span><Link to="/profile/edit">Edit your profile ↗</Link></div>
  </div>;
}
