import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { imageUrl } from '../api';
import Logo from './Logo';

// Wide banner at the top of a profile. No banner (or one that fails to load) -> the default banner design.
export default function ProfileBanner({ src, editLink }: { src: string | null; editLink?: string }) {
  const url = imageUrl(src);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  return (
    <div className="profile-banner">
      {url && !failed
        ? <img src={url} alt="" onError={() => setFailed(true)} />
        : <div className="profile-banner-default"><span>QREW / MEMBER</span><span className="profile-banner-mark"><Logo variant="icon" /></span></div>}
      <div className="profile-banner-shade" />
      {editLink && <Link className="banner-edit" to={editLink}>✎ Change banner</Link>}
    </div>
  );
}
