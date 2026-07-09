import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare, Users, Plus, Zap, ChevronRight, Menu, X,
  Mail, Phone, Sparkles, PenTool, Calendar, Eye,
  FileText, Target, Instagram, BarChart3, TrendingUp,
  Shield, Globe, Clock
} from 'lucide-react';

/* ─── Scroll Reveal Hook ─── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { threshold: 0.12 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

/* ─── Navbar ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Accueil', href: '#hero' },
    { label: 'Communication', href: '#nora' },
    { label: 'RH', href: '#leo' },
    { label: 'Fonctionnalités', href: '#features' },
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${scrolled ? 'nav-glass' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-xl font-extrabold text-[#D4A853] transition-all group-hover:gold-glow-text" style={{ fontFamily: 'var(--font-heading)' }}>LNR</span>
          <span className="text-base font-medium text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>AI HUB</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <a key={link.label} href={link.href}
              className="relative text-sm font-medium text-[#71717A] hover:text-[#FAFAFA] transition-colors duration-300 group">
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-gradient-to-r from-[#D4A853] to-[#E8C87A] transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link to="/dashboard"
            className="btn-gold text-sm px-6 py-2.5 rounded-full flex items-center gap-2">
            <span className="relative z-10 flex items-center gap-2">
              <Sparkles size={15} /> Accéder à la plateforme
            </span>
          </Link>
        </div>

        <button className="md:hidden text-[#FAFAFA] p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden nav-glass px-6 pb-6 animate-fade-in-up">
          {navLinks.map(link => (
            <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
              className="block py-3 text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors border-b border-white/5">{link.label}</a>
          ))}
          <Link to="/dashboard" className="block mt-4 btn-gold text-center text-sm py-3 rounded-full">
            <span className="relative z-10">Accéder à la plateforme</span>
          </Link>
        </div>
      )}
    </nav>
  );
}

/* ─── Hero ─── */
function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center px-6 pt-20 pb-20 overflow-hidden">
      {/* Decorative blurred orb */}
      <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(212,168,83,0.3) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      <div className="absolute bottom-1/4 -left-32 w-[400px] h-[400px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, rgba(212,168,83,0.2) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center w-full">
        {/* Left: Text */}
        <div className="order-2 lg:order-1">
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', color: '#22C55E' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-[#22C55E]" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]" />
            </span>
            Deux experts IA opérationnels 24/7
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] mb-6 animate-fade-in-up delay-100"
            style={{ fontFamily: 'var(--font-heading)', opacity: 0 }}>
            Votre <span className="gold-glow-text text-[#D4A853]">communication</span> virale
            <br className="hidden sm:block" />
            et votre <span className="gold-glow-text text-[#D4A853]">RH</span> autonome.
          </h1>

          <p className="text-base lg:text-lg text-[#71717A] max-w-lg mb-8 leading-relaxed animate-fade-in-up delay-200"
            style={{ opacity: 0 }}>
            Nora gère vos réseaux sociaux. Leo pilote votre recrutement.
            Des agents IA propulsés par Kimi qui travaillent pour vous en temps réel.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4 animate-fade-in-up delay-300" style={{ opacity: 0 }}>
            <Link to="/dashboard" className="btn-gold text-base px-8 py-3.5 rounded-full">
              <span className="relative z-10 flex items-center gap-2">
                <Sparkles size={17} /> Lancer la plateforme
              </span>
            </Link>
            <a href="#nora"
              className="border border-white/10 text-[#A1A1AA] hover:text-[#FAFAFA] hover:border-[#D4A853]/40 font-medium px-8 py-3.5 rounded-full transition-all duration-300 flex items-center gap-2">
              Découvrir les agents <ChevronRight size={15} />
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-6 mt-10 animate-fade-in-up delay-400" style={{ opacity: 0 }}>
            {[
              { icon: MessageSquare, text: '+30 000 posts' },
              { icon: Users, text: '1 200 recrutements' },
              { icon: Zap, text: '99.9% uptime' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-2 text-xs text-[#52525B]">
                <item.icon size={14} className="text-[#D4A853]" /> {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Illustration */}
        <div className="order-1 lg:order-2 animate-fade-in-left delay-300 flex justify-center" style={{ opacity: 0 }}>
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl opacity-30"
              style={{ background: 'radial-gradient(circle at center, rgba(212,168,83,0.2), transparent 70%)', filter: 'blur(40px)' }} />
            <img src="/images/hero-illustration.jpg" alt="AI Neural Network"
              className="relative rounded-3xl w-full max-w-lg border border-white/5 shadow-2xl" />
            {/* Floating badges */}
            <div className="absolute -bottom-4 -left-4 glass-card px-4 py-2 flex items-center gap-2 float-animation">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
              <span className="text-xs text-[#FAFAFA] font-medium">Nora en ligne</span>
            </div>
            <div className="absolute -top-4 -right-4 glass-card px-4 py-2 flex items-center gap-2 float-animation-delay">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
              <span className="text-xs text-[#FAFAFA] font-medium">Leo en ligne</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Nora Section ─── */
function NoraSection() {
  const { ref, visible } = useScrollReveal();
  const navigate = useNavigate();

  const features = [
    { icon: PenTool, title: 'Rédaction intelligente', desc: 'Posts LinkedIn, Instagram, newsletters. Nora adapte le ton à chaque plateforme.' },
    { icon: Eye, title: 'Création de visuels', desc: 'Concepts de carrousels, stories, reels alignés avec votre charte graphique.' },
    { icon: Calendar, title: 'Calendrier éditorial', desc: 'Planification automatique sur toute la semaine. Jamais à court d\'idées.' },
    { icon: BarChart3, title: 'Analytics & KPIs', desc: 'Suivi des performances en temps réel. Engagement, impressions, croissance.' },
  ];

  return (
    <section id="nora" className="relative py-28 px-6 overflow-hidden">
      <div className="absolute top-1/2 right-0 w-[300px] h-[300px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, rgba(212,168,83,0.25) 0%, transparent 70%)', filter: 'blur(60px)', transform: 'translateY(-50%)' }} />

      <div ref={ref} className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
            style={{ background: 'rgba(212,168,83,0.08)', border: '1px solid rgba(212,168,83,0.2)', color: '#D4A853' }}>
            <Instagram size={11} /> <Globe size={11} /> <span>Agent Communication</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#FAFAFA] mb-4 leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Nora. Votre <span className="text-[#D4A853]">community manager IA</span>.
          </h2>

          <p className="text-[#71717A] mb-8 leading-relaxed text-sm lg:text-base">
            Nora rédige, planifie et analyse vos contenus sur tous les réseaux sociaux.
            Propulsée par l'IA Kimi, elle génère des posts engageants et des stratégies qui convertissent.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {features.map((f, i) => (
              <div key={f.title} className={`flex items-start gap-3 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${200 + i * 100}ms` }}>
                <div className="w-9 h-9 rounded-xl bg-[rgba(212,168,83,0.08)] border border-[rgba(212,168,83,0.12)] flex items-center justify-center flex-shrink-0">
                  <f.icon size={15} className="text-[#D4A853]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#FAFAFA]">{f.title}</p>
                  <p className="text-xs text-[#52525B] mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/dashboard/chat/1')}
            className="btn-gold text-sm px-6 py-3 rounded-full inline-flex items-center gap-2">
            <span className="relative z-10 flex items-center gap-2">
              Discuter avec Nora <ChevronRight size={15} />
            </span>
          </button>
        </div>

        <div className={`transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
          <div className="glass-card p-1.5 card-highlight">
            <div className="bg-[#0D0D0F] rounded-[13px] p-5">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/[0.04]">
                <div className="relative">
                  <img src="/images/avatar-nora.png" alt="Nora" className="w-10 h-10 rounded-full ring-2 ring-[#D4A853]/20" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#22C55E] rounded-full ring-2 ring-[#0D0D0F]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#FAFAFA]">Nora</p>
                  <p className="text-[10px] text-[#22C55E] font-medium">Agent Communication · En ligne</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="gold-gradient text-[#0A0A0B] px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] text-sm font-medium shadow-lg shadow-[rgba(212,168,83,0.15)]">
                    Rédige-moi 3 posts LinkedIn pour notre lancement
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <img src="/images/avatar-nora.png" alt="Nora" className="w-7 h-7 rounded-full mt-1 flex-shrink-0" />
                  <div className="bg-[#18181B] border border-white/[0.04] text-[#FAFAFA] px-4 py-3 rounded-2xl rounded-tl-sm max-w-[92%] text-sm leading-relaxed">
                    <p className="text-[#D4A853] text-xs font-semibold mb-2">📝 3 versions prêtes :</p>
                    <p className="text-[#A1A1AA] text-xs mb-2"><strong className="text-[#FAFAFA]">1. Corporate</strong> — "Nous sommes fiers de vous annoncer le lancement de LNR AI Hub, notre plateforme d'agents IA autonomes..." 🚀</p>
                    <p className="text-[#A1A1AA] text-xs mb-2"><strong className="text-[#FAFAFA]">2. Storytelling</strong> — "Il y a 6 mois, je passais des nuits blanches à gérer mes réseaux sociaux. Aujourd'hui, Nora le fait pour moi." ✨</p>
                    <p className="text-[#A1A1AA] text-xs"><strong className="text-[#FAFAFA]">3. Choc</strong> — "Votre CM coûte 3 500€/mois. Nora fait le même travail pour 99€. Vous faites le calcul ?" 😏</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center gap-2">
                <div className="flex-1 h-9 bg-[#18181B] rounded-full flex items-center px-4 text-xs text-[#3F3F46]">
                  Écrivez votre message...
                </div>
                <div className="w-9 h-9 gold-gradient rounded-full flex items-center justify-center shadow-lg shadow-[rgba(212,168,83,0.2)]">
                  <Sparkles size={14} className="text-[#0A0A0B]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Leo Section ─── */
function LeoSection() {
  const { ref, visible } = useScrollReveal();
  const navigate = useNavigate();

  const features = [
    { icon: FileText, title: "Rédaction d'offres", desc: "Fiches de poste optimisées qui attirent les bons candidats sur LinkedIn et les jobboards." },
    { icon: Target, title: 'Screening intelligent', desc: "Analyse automatique des CV : tri par compétences, expérience et culture fit." },
    { icon: Users, title: 'Gestion des entretiens', desc: "Planification, rappels automatiques, grilles d'évaluation structurées." },
    { icon: Shield, title: 'Onboarding fluide', desc: "Parcours d'intégration personnalisé pour chaque nouvelle recrue." },
  ];

  return (
    <section id="leo" className="relative py-28 px-6 overflow-hidden">
      <div className="absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, rgba(212,168,83,0.25) 0%, transparent 70%)', filter: 'blur(60px)', transform: 'translateY(-50%)' }} />

      <div ref={ref} className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div className={`order-2 lg:order-1 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
          <div className="glass-card p-1.5 card-highlight">
            <div className="bg-[#0D0D0F] rounded-[13px] p-5">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/[0.04]">
                <div className="relative">
                  <img src="/images/avatar-leo.png" alt="Leo" className="w-10 h-10 rounded-full ring-2 ring-[#D4A853]/20" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#22C55E] rounded-full ring-2 ring-[#0D0D0F]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#FAFAFA]">Leo</p>
                  <p className="text-[10px] text-[#22C55E] font-medium">Agent RH · En ligne</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="gold-gradient text-[#0A0A0B] px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] text-sm font-medium shadow-lg shadow-[rgba(212,168,83,0.15)]">
                    34 CV pour Commercial B2B, peux-tu faire un pré-tri ?
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <img src="/images/avatar-leo.png" alt="Leo" className="w-7 h-7 rounded-full mt-1 flex-shrink-0" />
                  <div className="bg-[#18181B] border border-white/[0.04] text-[#FAFAFA] px-4 py-3 rounded-2xl rounded-tl-sm max-w-[92%] text-sm leading-relaxed">
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[{n:'34',l:'CV reçus'},{n:'12',l:'Qualifiés',g:true},{n:'14',l:'Écartés',r:true}].map(s => (
                        <div key={s.l} className="bg-[#0A0A0B] rounded-lg p-2 text-center">
                          <p className={`text-base font-bold ${s.g?'text-[#22C55E]':s.r?'text-[#EF4444]':'text-[#D4A853]'}`}>{s.n}</p>
                          <p className="text-[10px] text-[#3F3F46]">{s.l}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[#52525B] text-xs mb-1">Top 3 candidats :</p>
                    <p className="text-[#A1A1AA] text-xs">1. Marc D. — 5 ans B2B SaaS — Bac+5</p>
                    <p className="text-[#A1A1AA] text-xs">2. Sarah L. — 4 ans Fintech</p>
                    <p className="text-[#A1A1AA] text-xs">3. Karim B. — 6 ans Consulting — Bilingue</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`order-1 lg:order-2 transition-all duration-700 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
            style={{ background: 'rgba(212,168,83,0.08)', border: '1px solid rgba(212,168,83,0.2)', color: '#D4A853' }}>
            <Users size={11} /> <span>Agent RH</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#FAFAFA] mb-4 leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Leo. Votre <span className="text-[#D4A853]">responsable RH IA</span>.
          </h2>

          <p className="text-[#71717A] mb-8 leading-relaxed text-sm lg:text-base">
            Leo gère vos recrutements de A à Z : offres, screening, entretiens, onboarding.
            Un expert RH propulsé par l'IA Kimi qui structure et optimise vos process.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {features.map((f, i) => (
              <div key={f.title} className={`flex items-start gap-3 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${200 + i * 100}ms` }}>
                <div className="w-9 h-9 rounded-xl bg-[rgba(212,168,83,0.08)] border border-[rgba(212,168,83,0.12)] flex items-center justify-center flex-shrink-0">
                  <f.icon size={15} className="text-[#D4A853]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#FAFAFA]">{f.title}</p>
                  <p className="text-xs text-[#52525B] mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/dashboard/chat/2')}
            className="btn-gold text-sm px-6 py-3 rounded-full inline-flex items-center gap-2">
            <span className="relative z-10 flex items-center gap-2">
              Discuter avec Leo <ChevronRight size={15} />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── Features ─── */
function FeaturesSection() {
  const { ref, visible } = useScrollReveal();

  const features = [
    { icon: MessageSquare, title: 'Chat temps réel', desc: 'Discutez naturellement. L\'IA comprend le contexte et mémorise vos préférences.' },
    { icon: Plus, title: 'Création d\'agents', desc: 'Créez des agents sur mesure. Définissez leur personnalité et compétences.' },
    { icon: Zap, title: 'Propulsé par Kimi', desc: 'L\'intelligence de Kimi au service de votre communication et RH.' },
    { icon: Clock, title: 'Historique persistant', desc: 'Toutes vos conversations sont sauvegardées. Reprenez où vous en étiez.' },
  ];

  return (
    <section id="features" className="relative py-28 px-6">
      <div className="section-divider max-w-4xl mx-auto mb-28" />

      <div ref={ref} className="max-w-7xl mx-auto">
        <div className={`text-center mb-14 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#D4A853] mb-3">Fonctionnalités</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>
            Une plateforme, deux experts.
          </h2>
          <p className="text-[#71717A] mt-3 max-w-lg mx-auto text-sm">
            Tout ce dont vous avez besoin pour gérer votre communication et vos RH.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <div key={f.title}
              className={`glass-card p-6 card-highlight transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, rgba(212,168,83,0.12), rgba(212,168,83,0.04))', border: '1px solid rgba(212,168,83,0.1)' }}>
                <f.icon size={20} className="text-[#D4A853]" />
              </div>
              <h3 className="text-sm font-bold text-[#FAFAFA] mb-1.5" style={{ fontFamily: 'var(--font-heading)' }}>{f.title}</h3>
              <p className="text-xs text-[#52525B] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Dashboard Preview ─── */
function DashboardPreview() {
  const { ref, visible } = useScrollReveal();

  return (
    <section className="relative py-28 px-6 overflow-hidden">
      <div className="section-divider max-w-4xl mx-auto mb-28" />

      <div ref={ref} className="max-w-7xl mx-auto">
        <div className={`text-center mb-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#D4A853] mb-3">Interface</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#FAFAFA] mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
            Votre cockpit IA.
          </h2>
          <p className="text-[#71717A] text-sm max-w-md mx-auto">
            Un dashboard sombre et élégant pour piloter Nora et Leo en temps réel.
          </p>
        </div>

        <div className={`transition-all duration-1000 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="glass-card p-2 max-w-5xl mx-auto">
            <img src="/images/mockup-dashboard.jpg" alt="Dashboard LNR AI Hub"
              className="rounded-xl w-full border border-white/[0.03]" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Templates ─── */
function TemplatesSection() {
  const navigate = useNavigate();
  const { ref, visible } = useScrollReveal();

  const templates = [
    { title: 'Community Manager IA', role: 'Gère tous vos réseaux sociaux', icon: Instagram, agentId: 1 },
    { title: 'Copywriter LinkedIn', role: 'Posts qui convertissent', icon: PenTool, agentId: 1 },
    { title: 'Analyste Social Media', role: 'Analytics et optimisation', icon: BarChart3, agentId: 1 },
    { title: 'Responsable Recrutement', role: "De l'offre à l'embauche", icon: FileText, agentId: 2 },
    { title: "Chargé d'Onboarding", role: 'Intégration des nouveaux', icon: Users, agentId: 2 },
    { title: 'Analyste RH', role: 'Reporting et planification', icon: TrendingUp, agentId: 2 },
  ];

  return (
    <section className="relative py-28 px-6">
      <div className="section-divider max-w-4xl mx-auto mb-28" />

      <div ref={ref} className="max-w-7xl mx-auto">
        <div className={`text-center mb-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#D4A853] mb-3">Templates</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>
            Lancez-vous en un clic.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl, i) => (
            <button key={tpl.title} onClick={() => navigate(`/dashboard/chat/${tpl.agentId}`)}
              className={`glass-card p-5 text-left card-highlight transition-all duration-500 hover:border-[#D4A853]/30 group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(212,168,83,0.06)] border border-[rgba(212,168,83,0.1)] flex items-center justify-center">
                  <tpl.icon size={17} className="text-[#D4A853]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>{tpl.title}</p>
                  <p className="text-[11px] text-[#3F3F46]">{tpl.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#D4A853] group-hover:gap-2 transition-all">
                Utiliser <ChevronRight size={12} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CTASection() {
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(212,168,83,0.2) 0%, transparent 60%)', filter: 'blur(100px)' }} />
      </div>

      <div className="max-w-2xl mx-auto text-center relative">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#FAFAFA] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
          Prêt à déployer <span className="text-[#D4A853]">Nora</span> et <span className="text-[#D4A853]">Leo</span> ?
        </h2>
        <p className="text-[#71717A] mb-3">
          Votre communication et votre RH pilotées par l'IA. Vous, vous concentrez sur la croissance.
        </p>
        <p className="text-xs text-[#3F3F46] mb-10">
          Économisez jusqu'à 6 000€/mois en remplaçant votre agence social media et votre cabinet de recrutement.
        </p>
        <Link to="/dashboard" className="btn-gold text-lg px-10 py-4 rounded-full inline-flex items-center gap-2 gold-glow-strong">
          <span className="relative z-10 flex items-center gap-2">
            <Sparkles size={20} /> Lancer gratuitement
          </span>
        </Link>
        <p className="text-[10px] text-[#3F3F46] mt-6 uppercase tracking-wider">Sans engagement. Annulation à tout moment.</p>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="relative border-t border-white/[0.04] py-10 px-6" style={{ background: 'rgba(8,8,9,0.9)' }}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-2">
          <span className="text-lg font-extrabold text-[#D4A853]" style={{ fontFamily: 'var(--font-heading)' }}>LNR</span>
          <span className="text-sm font-medium text-[#FAFAFA]">AI HUB</span>
          <span className="text-xs text-[#3F3F46] ml-3">© 2025 LNR Finance</span>
        </div>
        <div className="flex items-center gap-5 text-xs text-[#3F3F46]">
          <span className="hover:text-[#A1A1AA] transition-colors cursor-pointer">Mentions légales</span>
          <span className="hover:text-[#A1A1AA] transition-colors cursor-pointer">Confidentialité</span>
          <span className="hover:text-[#A1A1AA] transition-colors cursor-pointer">CGU</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-[#3F3F46]">
          <span className="flex items-center gap-1"><Mail size={11} /> contact@lnr-finance.com</span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="relative z-10 grain-overlay">
      <Navbar />
      <HeroSection />
      <NoraSection />
      <LeoSection />
      <FeaturesSection />
      <DashboardPreview />
      <TemplatesSection />
      <CTASection />
      <Footer />
    </div>
  );
}
