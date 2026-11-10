import { useEffect, useState } from 'react';
import { imageUrl } from '../api';
import DefaultAvatarIcon from './DefaultAvatarIcon';

// Profile picture. No photo, or a photo that fails to load -> the default avatar icon (never a broken image).
export default function Avatar({ src, size = 36 }: { src: string | null; size?: number }) {
  const url = imageUrl(src);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  return (
    <span className="avatar" style={{ width: size, height: size }}>
      {url && !failed ? <img src={url} alt="" onError={() => setFailed(true)} /> : <DefaultAvatarIcon />}
    </span>
  );
}
