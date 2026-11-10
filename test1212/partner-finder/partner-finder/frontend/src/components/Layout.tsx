import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';
import { useRealtime } from '../realtime';
import Avatar from './Avatar';
import Logo from './Logo';
import LoadingScreen from './LoadingScreen';

export default function Layout() {
  const { user, loading, logout } = useAuth();
  const { unread } = useRealtime();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <NavLink to="/discover" className="sidebar-brand"><Logo /></NavLink>
        {/* Phones hide the sidebar footer (where the desktop logout lives), so they get their own logout in the top bar. */}
        <button className="logout-button mobile-logout" onClick={logout} aria-label="Log out">Log out <span aria-hidden="true">↪</span></button>
        <div className="sidebar-label">DISCOVER</div>
        <nav className="sidebar-nav">
          <NavLink to="/discover"><span className="nav-icon">⌕</span><span>Discover</span></NavLink>
          <NavLink to="/requests"><span className="nav-icon">↗</span><span>Requests</span></NavLink>
          <NavLink to="/chats"><span className="nav-icon">◌</span><span>Messages</span>{unread > 0 && <span className="sidebar-badge">{unread}</span>}</NavLink>
        </nav>
        <div className="sidebar-label sidebar-label-lower">PERSONAL</div>
        <nav className="sidebar-nav"><NavLink to="/profile" end><span className="nav-icon">◉</span><span>My profile</span></NavLink>{user.is_admin && <NavLink to="/admin"><span className="nav-icon">⚙</span><span>Admin</span></NavLink>}</nav>
        <div className="sidebar-spacer"/>
        <div className="sidebar-tip"><span className="tip-mark">✦</span><strong>Good connections<br/>start with you.</strong><p>Keep your profile up to date to find better matches.</p><NavLink to="/profile/edit">Edit profile ↗</NavLink></div>
        <div className="sidebar-user"><Avatar src={user.avatar_url} size={38}/><div className="sidebar-user-info"><strong>{user.name}</strong><small>My account</small></div><button className="logout-button" onClick={logout} title="Log out" aria-label="Log out">↪</button></div>
      </aside>
      <main className="app-main"><div className="app-main-inner"><Outlet /></div></main>
    </div>
  );
}
