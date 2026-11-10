import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import BasicTab from '../components/BasicTab';
import CreativeTab from '../components/CreativeTab';
import Avatar from '../components/Avatar';
import GamingTab from '../components/GamingTab';
import { Bio, ProfileData } from '../types';

type Tab = 'basic' | 'gaming' | 'creative';

export default function Profile() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('basic');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [bio, setBio] = useState<Bio | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api<ProfileData>('/me/profile'), api<Bio>('/me/bio')])
      .then(([p, b]) => { setProfile(p); setBio(b); })
      .catch(() => setError('Could not load your profile.'));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!profile || !bio) return <p className="muted">Loading…</p>;

  // All three tabs stay mounted (just hidden), so unsaved edits are not lost when switching.
  return (
    <div className="stack profile-page">
      <div className="profile-hero">
        <div className="profile-hero-top"><span>YOUR SPACE / PROFILE</span><span className={user!.profile_completed ? 'profile-state complete' : 'profile-state'}>{user!.profile_completed ? 'PROFILE READY' : 'INCOMPLETE PROFILE'}</span></div>
        <div className="profile-hero-main"><Avatar src={user!.avatar_url} size={76} /><div><h1>{user!.name}</h1><p>{profile.bio || 'Add a short introduction so people know who they are connecting with.'}</p></div></div>
        <div className="profile-hero-foot"><span>One profile. Two ways to connect.</span><span>GAMING <i/> CREATIVE</span></div>
      </div>
      {!user!.profile_completed && (
        <div className="card warn">
          Complete your profile to unlock recommendations: write a short bio, set your location, and add at least one game or creative skill.
        </div>
      )}
      <div className="page-tabs">
        {(['basic', 'gaming', 'creative'] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t === 'basic' ? 'Basic info' : t === 'gaming' ? '🎮 Gaming' : '🎨 Creative'}</button>
        ))}
      </div>
      <div hidden={tab !== 'basic'}><BasicTab identity={{ name: user!.name, avatar_url: user!.avatar_url }} profile={profile} bio={bio} onSaved={(p, b) => { setProfile(p); setBio(b); }} /></div>
      <div hidden={tab !== 'gaming'}><GamingTab bio={bio} onSaved={setBio} /></div>
      <div hidden={tab !== 'creative'}><CreativeTab bio={bio} onSaved={setBio} /></div>
    </div>
  );
}
