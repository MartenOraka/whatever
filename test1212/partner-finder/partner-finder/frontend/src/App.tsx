import { Navigate, Route, Routes } from 'react-router-dom';
import Intro from './components/Intro';
import Layout from './components/Layout';
import Admin from './pages/Admin';
import AdminProfile from './pages/AdminProfile';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Discover from './pages/Discover';
import Chats from './pages/Chats';
import Profile from './pages/Profile';
import MyProfile from './pages/MyProfile';
import Requests from './pages/Requests';
import UserProfile from './pages/UserProfile';

export default function App() {
  return (
    <>
      <Intro />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route element={<Layout />}>
          <Route path="/discover" element={<Discover />} />
          <Route path="/profile" element={<MyProfile />} />
          <Route path="/profile/edit" element={<Profile />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/chats/:convId?" element={<Chats />} />
          <Route path="/u/:id" element={<UserProfile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/profiles/:id" element={<AdminProfile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
