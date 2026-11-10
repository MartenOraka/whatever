import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth';
import DefaultAvatarIcon from '../components/DefaultAvatarIcon';
import { APP_NAME, SLOGAN } from '../config';
import Logo from '../components/Logo';
import LoadingScreen from '../components/LoadingScreen';
import RoleIcon from '../components/RoleIcons';
import { CREW_ROLES } from '../options';

const examples = [
  { initials: 'N', name: 'nightshift', kind: 'GAMING', detail: 'CS2 · Deadlock · Co-op', looking: 'A regular duo for evening sessions', color: 'violet' },
  { initials: 'M', name: 'mira.frames', kind: 'CREATIVE', detail: 'Blender · 3D art · Video', looking: 'A partner for a small atmospheric game', color: 'cyan' },
  { initials: 'K', name: 'kaito.dev', kind: 'CREATIVE', detail: 'TypeScript · React · UI', looking: 'A designer or artist to build a side project', color: 'pink' },
];

export default function Home() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // The page is not rendered while auth is loading. Wait for that phase to finish
    // before querying reveal nodes; otherwise the observer attaches to an empty page.
    if (loading || user) return;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (!nodes.length) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px 80px 0px' });
    nodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) node.classList.add('is-visible');
      else observer.observe(node);
    });
    return () => observer.disconnect();
  }, [loading, user]);

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/discover" replace />;

  return (
    <div className="landing-page">
      <div className="landing-ambient" aria-hidden="true" />
      <header className="landing-nav">
        <Link to="/" className="landing-brand" aria-label={APP_NAME}><Logo /></Link>
        <nav className="landing-links"><a href="#directions">Explore</a><a href="#how-it-works">How it works</a><a href="#community">Examples</a></nav>
        <div className="landing-auth"><Link className="landing-login" to="/login">Log in</Link><Link className="btn primary landing-cta-small" to="/register">Create profile <span>↗</span></Link></div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot"/> GAMERS · DEVELOPERS · ARTISTS · IDEATORS</div>
            <h1 className="slogan" aria-label={SLOGAN}>PLAY. CODE.<br/>CREATE.<br/><span>AS A CREW.</span></h1>
            <p className="hero-lead">Find your people, connect, grow and build something that matters. One profile for the games you play and the things you make, without the pointless scrolling.</p>
            <div className="hero-actions"><Link className="btn primary hero-button" to="/register">Find your people <span>↗</span></Link><a className="hero-secondary" href="#directions">Explore both worlds <span>↓</span></a></div>
            <div className="hero-proof"><div className="proof-avatars"><i>G</i><i>C</i><i>+</i></div><span>For players, creators and collaborators.</span></div>
          </div>
          <div className="hero-art crew-art" role="group" aria-label="The four QREW roles: ideator, gamer, developer, artist and designer">
            <img className="crew-illustration" src="/brand/hero-crew.jpg" width="761" height="577" alt="Four friends sitting together above a glowing city. Their hoodies show a lightbulb, a game controller, code brackets and a paint palette." />
            <ul className="crew-legend">{CREW_ROLES.map((r) => <li key={r.key} title={r.hint}><RoleIcon role={r.key} size={16} /><span>{r.label}</span></li>)}</ul>
          </div>
          <a className="hero-scroll" href="#directions">SCROLL TO EXPLORE <span>↓</span></a>
        </section>

        <section className="landing-intro reveal" id="how-it-works"><div className="section-kicker">ONE PLACE. MANY POSSIBILITIES.</div><div className="intro-grid"><h2>Not just finding<br/><span>someone to play.</span></h2><p>Sometimes you need a teammate. Sometimes you need an artist, a developer, or simply someone who gets your idea. QREW helps you find the right person for what you want to do.</p></div></section>

        <section className="landing-directions reveal" id="directions">
          <div className="section-heading"><div><div className="section-kicker">PICK YOUR NEXT ADVENTURE</div><h2>Two paths.<br/><span>Same goal.</span></h2></div><p>Whether you're chasing a win or bringing an idea to life, start with people who are into the same things.</p></div>
          <div className="direction-grid">
            <article className="direction-card direction-gaming"><div className="direction-top"><span>01 / GAMING</span><span className="direction-symbol">⌁</span></div><h3>Find your<br/>next teammate.</h3><p>Discover players with your games, playstyle and schedule. From casual co-op to competitive queues.</p><div className="direction-tags"><span>CS2</span><span>Deadlock</span><span>Co-op</span><span>More games</span></div><Link to="/register">Find a gaming partner <b>↗</b></Link></article>
            <article className="direction-card direction-creative"><div className="direction-top"><span>02 / CREATIVE</span><span className="direction-symbol">✳</span></div><h3>Make your<br/>next idea real.</h3><p>Meet developers, artists, designers and makers who want to create, learn or build something together.</p><div className="direction-tags"><span>Blender</span><span>Programming</span><span>Video</span><span>Design</span></div><Link to="/register">Find a creative partner <b>↗</b></Link></article>
          </div>
        </section>

        <section className="landing-community reveal" id="community"><div className="section-heading"><div><div className="section-kicker">A GLIMPSE OF WHAT'S POSSIBLE</div><h2>Different skills.<br/><span>Shared energy.</span></h2></div><p>These are illustrative demo profiles, not real members. Your community starts with the people you meet.</p></div>
          <div className="demo-grid">{examples.map((person) => <article className={`demo-card demo-${person.color}`} key={person.name}><div className="demo-top"><span>DEMO PROFILE</span><span>{person.kind}</span></div><div className="demo-person"><div className="demo-avatar"><DefaultAvatarIcon bare /></div><div><h3>{person.name}</h3><span>{person.detail}</span></div></div><div className="demo-looking"><small>LOOKING FOR</small><p>{person.looking}</p></div><div className="demo-foot"><span>Example profile</span><span>✦</span></div></article>)}</div>
        </section>

        <section className="landing-steps reveal"><div className="section-kicker">GET STARTED IN THREE STEPS</div><div className="steps-grid"><article><span>01</span><h3>Build your profile</h3><p>Show what you love doing, what you can bring, and what kind of partner you're looking for.</p></article><article><span>02</span><h3>Find your match</h3><p>Explore people across Gaming and Creative, with recommendations based on shared interests.</p></article><article><span>03</span><h3>Start something</h3><p>Send a request, connect, and take your next game or idea beyond the starting screen.</p></article></div></section>

        <section className="landing-bottom reveal"><div className="bottom-orb"/><div className="section-kicker">YOUR NEXT CONNECTION STARTS HERE</div><h2>Find your people.<br/><span>Then make it happen.</span></h2><p>One profile for the things you play and the things you create.</p><Link className="btn primary hero-button" to="/register">Create your free profile <span>↗</span></Link><small>No pressure. Just a place to find your kind of people.</small></section>
      </main>
      <footer className="landing-footer"><Link to="/" className="landing-brand" aria-label={APP_NAME}><Logo /></Link><span>{SLOGAN}</span><div><Link to="/login">Log in</Link><Link to="/register">Sign up</Link></div></footer>
    </div>
  );
}
