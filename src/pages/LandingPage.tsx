import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare, Users, Plus, LayoutDashboard, Link2,
  Zap, ChevronRight, Menu, X, Mail, Phone, Sparkles, BarChart3,
  PenTool, Calendar, Eye, FileText, Target, Award, Instagram, Linkedin
} from 'lucide-react';

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { threshold: 0.15 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Accueil', href: '#hero' },
    { label: 'Communication', href: '#agents' },
    { label: 'RH', href: '#rh' },
    { label: 'Fonctionnalités', href: '#features' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'nav-glass' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-extrabold" style={{ fontFamily: 'var(--font-heading)', color: '#D4A853' }}>
            LNR
          </span>
          <span className="text-lg font-medium text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>
            AI HUB
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              className="relative text-sm font-medium text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#D4A853] transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        <Link
          to="/dashboard"
          className="hidden md:inline-flex gold-gradient text-[#0A0A0B] text-sm font-semibold px-6 py-2.5 rounded-full hover:brightness-110 transition-all duration-200 hover:shadow-[0_0_30px_rgba(212,168,83,0.3)]"
        >
          Accéder à la plateforme
        </Link>

        <button
          className="md:hidden text-[#FAFAFA]"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden nav-glass px-6 pb-6">
          {navLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-3 text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/dashboard"
            className="block mt-4 gold-gradient text-[#0A0A0B] text-center text-sm font-semibold px-6 py-3 rounded-full"
          >
            Accéder à la plateforme
          </Link>
        </div>
      )}
    </nav>
  );
}

const FEATURES_COM = [
  { icon: PenTool, title: 'Rédaction intelligente', desc: 'Posts LinkedIn, Instagram, newsletters, blogs. Nora adapte le ton à votre audience et surfe sur les tendances.' },
  { icon: Eye, title: 'Création de visuels', desc: 'Concepts de carrousels, stories, reels. Des visuels alignés avec votre charte graphique en quelques secondes.' },
  { icon: Calendar, title: 'Calendrier éditorial', desc: 'Planification automatique de vos contenus sur toute la semaine. Jamais à court d\'idées.' },
  { icon: BarChart3, title: 'Analytics & KPIs', desc: 'Suivi des performances en temps réel. Taux d\'engagement, impressions, croissance des abonnés.' },
];

const FEATURES_RH = [
  { icon: FileText, title: 'Rédaction d\'offres', desc: 'Des fiches de poste optimisées qui attirent les bons candidats, publiées automatiquement sur LinkedIn et les jobboards.' },
  { icon: Target, title: 'Screening intelligent', desc: 'Analyse automatique des CV : tri par compétences, expérience et culture fit. Vous ne loupez plus un bon profil.' },
  { icon: Users, title: 'Gestion des entretiens', desc: 'Planification, rappels automatiques, grilles d\'évaluation. Tout votre processus de recrutement structuré.' },
  { icon: Award, title: 'Onboarding fluide', desc: 'Parcours d\'intégration personnalisé pour chaque nouvelle recrue. Documents, formation, suivi.' },
];

function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 pb-20">
      <div className="max-w-4xl mx-auto">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8 animate-fade-in-up"
          style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#22C55E',
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-[#22C55E]" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]" />
          </span>
          Deux experts IA à votre service 24/7
        </div>

        <h1
          className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.05] mb-6 animate-fade-in-up"
          style={{
            fontFamily: 'var(--font-heading)',
            animationDelay: '0.1s',
            opacity: 0,
          }}
        >
          Votre communication{' '}
          <span className="text-glow-gold" style={{ color: '#D4A853' }}>virale</span>
          <br />
          et votre RH{' '}
          <span className="text-glow-gold" style={{ color: '#D4A853' }}>autonome</span>.
        </h1>

        <p
          className="text-lg text-[#A1A1AA] max-w-2xl mx-auto mb-10 animate-fade-in-up"
          style={{ animationDelay: '0.2s', opacity: 0 }}
        >
          Nora gère vos réseaux sociaux : rédaction, visuels, planning et analytics.
          Leo pilote votre recrutement : offres, screening, entretiens et onboarding.
          Vous concentrez-vous sur l'essentiel.
        </p>

        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
          style={{ animationDelay: '0.3s', opacity: 0 }}
        >
          <Link
            to="/dashboard"
            className="gold-gradient text-[#0A0A0B] font-semibold px-8 py-4 rounded-full hover:brightness-110 transition-all duration-200 hover:shadow-[0_0_40px_rgba(212,168,83,0.3)] flex items-center gap-2"
          >
            <Sparkles size={18} />
            Lancer la plateforme
          </Link>
          <a
            href="#agents"
            className="border border-white/15 text-[#FAFAFA] font-medium px-8 py-4 rounded-full hover:border-[#D4A853]/50 hover:bg-[rgba(212,168,83,0.05)] transition-all duration-200"
          >
            Découvrir les agents
          </a>
        </div>

        <div
          className="flex flex-wrap items-center justify-center gap-8 mt-12 animate-fade-in-up"
          style={{ animationDelay: '0.4s', opacity: 0 }}
        >
          {[
            { icon: MessageSquare, text: '+30 000 posts rédigés' },
            { icon: Users, text: '1 200 recrutements aidés' },
            { icon: Zap, text: '99.9% disponibilité' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-2 text-sm text-[#52525B]">
              <item.icon size={16} className="text-[#D4A853]" />
              {item.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NoraSection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="agents" className="relative py-24 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div ref={ref} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
            style={{ background: 'rgba(212, 168, 83, 0.1)', border: '1px solid rgba(212, 168, 83, 0.2)', color: '#D4A853' }}>
            <Instagram size={12} />
            <Linkedin size={12} />
            <span>Communication</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#FAFAFA] mb-4 leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Nora. Votre community manager <span style={{ color: '#D4A853' }}>IA</span>.
          </h2>

          <p className="text-[#A1A1AA] mb-6 leading-relaxed">
            Nora rédige vos posts LinkedIn et Instagram, crée vos visuels, planifie votre calendrier éditorial et analyse vos performances. Plus besoin d'agence ou de CM junior.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {FEATURES_COM.map(f => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgba(212,168,83,0.1)] flex items-center justify-center flex-shrink-0">
                  <f.icon size={14} className="text-[#D4A853]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#FAFAFA]">{f.title}</p>
                  <p className="text-xs text-[#52525B] mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            to="/dashboard/chat/nora"
            className="inline-flex items-center gap-2 gold-gradient text-[#0A0A0B] font-semibold px-6 py-3 rounded-full hover:brightness-110 transition-all"
          >
            Discuter avec Nora
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className={`transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
          <div className="glass-card p-1 overflow-hidden" style={{ borderColor: 'rgba(212, 168, 83, 0.2)' }}>
            <div className="bg-[#111113]/80 rounded-[14px] p-5">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/5">
                <img src="/images/avatar-nora.png" alt="Nora" className="w-10 h-10 rounded-full" />
                <div>
                  <p className="text-sm font-semibold text-[#FAFAFA]">Nora</p>
                  <p className="text-xs text-[#22C55E]">Agent Communication · En ligne</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="gold-gradient text-[#0A0A0B] px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] text-sm font-medium">
                    Rédige-moi 3 posts LinkedIn pour le lancement de notre nouvelle offre IA
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <img src="/images/avatar-nora.png" alt="Nora" className="w-7 h-7 rounded-full mt-1 flex-shrink-0" />
                  <div className="bg-[#18181B] border border-white/5 text-[#FAFAFA] px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%] text-sm leading-relaxed">
                    <p className="mb-2">Voici 3 versions prêtes à publier :</p>
                    <p className="text-[#A1A1AA] mb-2"><strong className="text-[#D4A853]">1. Corporate</strong> — "Nous sommes fiers de vous annoncer le lancement de LNR AI Hub, notre plateforme d'agents IA autonomes..." 🚀</p>
                    <p className="text-[#A1A1AA] mb-2"><strong className="text-[#D4A853]">2. Storytelling</strong> — "Il y a 6 mois, je passais des nuits blanches à gérer mes réseaux sociaux..." ✨</p>
                    <p className="text-[#A1A1AA]"><strong className="text-[#D4A853]">3. Choc</strong> — "Votre CM coûte 3 500€/mois. Nora fait le même travail pour 99€. Vous faites le calcul ?" 😏</p>
                    <p className="mt-2 text-[#52525B] text-xs">Quel ton préférez-vous ? Je peux aussi créer les visuels associés.</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                <div className="flex-1 h-9 bg-[#18181B] rounded-full flex items-center px-4 text-xs text-[#52525B]">
                  Écrivez votre message...
                </div>
                <div className="w-9 h-9 gold-gradient rounded-full flex items-center justify-center">
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

function LeoSection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="rh" className="relative py-24 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div className={`transition-all duration-700 delay-200 order-2 lg:order-1 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
          <div className="glass-card p-1 overflow-hidden" style={{ borderColor: 'rgba(212, 168, 83, 0.2)' }}>
            <div className="bg-[#111113]/80 rounded-[14px] p-5">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/5">
                <img src="/images/avatar-leo.png" alt="Leo" className="w-10 h-10 rounded-full" />
                <div>
                  <p className="text-sm font-semibold text-[#FAFAFA]">Leo</p>
                  <p className="text-xs text-[#22C55E]">Agent RH · En ligne</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="gold-gradient text-[#0A0A0B] px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] text-sm font-medium">
                    J'ai 34 CV pour le poste de Commercial B2B. Peux-tu faire un pré-tri ?
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <img src="/images/avatar-leo.png" alt="Leo" className="w-7 h-7 rounded-full mt-1 flex-shrink-0" />
                  <div className="bg-[#18181B] border border-white/5 text-[#FAFAFA] px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%] text-sm leading-relaxed">
                    <p className="mb-2">Screening terminé ! Voici les résultats :</p>
                    <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                      <div className="bg-[#0A0A0B] rounded-lg p-2">
                        <p className="text-lg font-bold text-[#D4A853]">34</p>
                        <p className="text-[10px] text-[#52525B]">CV reçus</p>
                      </div>
                      <div className="bg-[#0A0A0B] rounded-lg p-2">
                        <p className="text-lg font-bold text-[#22C55E]">12</p>
                        <p className="text-[10px] text-[#52525B]">Qualifiés</p>
                      </div>
                      <div className="bg-[#0A0A0B] rounded-lg p-2">
                        <p className="text-lg font-bold text-[#EF4444]">14</p>
                        <p className="text-[10px] text-[#52525B]">Écartés</p>
                      </div>
                    </div>
                    <p className="text-[#A1A1AA] text-xs mb-2"><strong className="text-[#FAFAFA]">Top 3 :</strong></p>
                    <p className="text-[#A1A1AA] text-xs">1. Marc D. — 5 ans B2B SaaS — Bac+5</p>
                    <p className="text-[#A1A1AA] text-xs">2. Sarah L. — 4 ans Fintech — LinkedIn solide</p>
                    <p className="text-[#A1A1AA] text-xs">3. Karim B. — 6 ans Consulting — Bilingue</p>
                    <p className="mt-2 text-[#52525B] text-xs">Je programme les entretiens pour cette semaine ?</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                <div className="flex-1 h-9 bg-[#18181B] rounded-full flex items-center px-4 text-xs text-[#52525B]">
                  Écrivez votre message...
                </div>
                <div className="w-9 h-9 gold-gradient rounded-full flex items-center justify-center">
                  <Sparkles size={14} className="text-[#0A0A0B]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div ref={ref} className={`order-1 lg:order-2 transition-all duration-700 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
            style={{ background: 'rgba(212, 168, 83, 0.1)', border: '1px solid rgba(212, 168, 83, 0.2)', color: '#D4A853' }}>
            <Users size={12} />
            <span>Ressources Humaines</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#FAFAFA] mb-4 leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Leo. Votre responsable RH <span style={{ color: '#D4A853' }}>IA</span>.
          </h2>

          <p className="text-[#A1A1AA] mb-6 leading-relaxed">
            Leo gère vos recrutements de A à Z : rédaction d'offres optimisées, screening intelligent des CV, planification d'entretiens, onboarding personnalisé et reporting RH mensuel.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {FEATURES_RH.map(f => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgba(212,168,83,0.1)] flex items-center justify-center flex-shrink-0">
                  <f.icon size={14} className="text-[#D4A853]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#FAFAFA]">{f.title}</p>
                  <p className="text-xs text-[#52525B] mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            to="/dashboard/chat/leo"
            className="inline-flex items-center gap-2 gold-gradient text-[#0A0A0B] font-semibold px-6 py-3 rounded-full hover:brightness-110 transition-all"
          >
            Discuter avec Leo
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="features" className="relative py-24 px-6">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#D4A853] mb-4">
            Fonctionnalités
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>
            Une plateforme, deux experts.
          </h2>
          <p className="text-[#A1A1AA] mt-4 max-w-xl mx-auto">
            Tout ce dont vous avez besoin pour gérer votre communication et vos ressources humaines, sans embaucher.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: MessageSquare, title: 'Chat temps réel', desc: 'Discutez naturellement avec Nora et Leo. Comprendre le contexte, mémorisent vos préférences.' },
            { icon: Plus, title: 'Création d\'agents', desc: 'Créez des agents personnalisés en quelques clics. Définissez leur personnalité et compétences.' },
            { icon: LayoutDashboard, title: 'Tableau de bord', desc: 'Vue d\'ensemble de votre activité com et RH. Performances, conversations, statuts.' },
            { icon: Link2, title: 'Intégrations', desc: 'LinkedIn, Instagram, Gmail, Google Calendar, Slack, Notion. Tout connecté.' },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`glass-card p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[#D4A853]/30 ${
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(212, 168, 83, 0.1)' }}>
                  <Icon size={20} className="text-[#D4A853]" />
                </div>
                <h3 className="text-base font-bold text-[#FAFAFA] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  {feature.title}
                </h3>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TemplatesSection() {
  const navigate = useNavigate();
  const { ref, visible } = useScrollReveal();

  return (
    <section className="relative py-24 px-6">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <div className={`text-center mb-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#D4A853] mb-4">
            Templates prêts à l'emploi
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>
            Lancez-vous en quelques clics.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { title: 'Community Manager IA', role: 'Gère tous vos réseaux sociaux', icon: Instagram, agent: 'nora' },
            { title: 'Copywriter LinkedIn', role: 'Rédige des posts qui convertissent', icon: PenTool, agent: 'nora' },
            { title: 'Analyste Social Media', role: 'Analytics et optimisation', icon: BarChart3, agent: 'nora' },
            { title: 'Responsable Recrutement', role: 'De l\'offre à l\'embauche', icon: FileText, agent: 'leo' },
            { title: 'Chargé d\'Onboarding', role: 'Intégration des nouveaux', icon: Users, agent: 'leo' },
            { title: 'Analyste RH', role: 'Reporting et planification', icon: Target, agent: 'leo' },
          ].map((tpl, i) => {
            const Icon = tpl.icon;
            return (
              <button
                key={tpl.title}
                onClick={() => navigate(`/dashboard/chat/${tpl.agent}`)}
                className={`glass-card p-5 text-left transition-all duration-500 hover:-translate-y-1 hover:border-[#D4A853]/30 group ${
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[rgba(212,168,83,0.1)] flex items-center justify-center">
                    <Icon size={18} className="text-[#D4A853]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>{tpl.title}</p>
                    <p className="text-xs text-[#52525B]">{tpl.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#D4A853] group-hover:gap-2.5 transition-all">
                  Utiliser ce template
                  <ChevronRight size={12} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section id="cta" className="relative py-32 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#FAFAFA] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
          Prêt à déployer <span style={{ color: '#D4A853' }}>Nora</span> et <span style={{ color: '#D4A853' }}>Leo</span> ?
        </h2>
        <p className="text-[#A1A1AA] mb-4">
          Votre communication et votre RH pilotées par l'IA. Vous, vous concentrez sur la croissance.
        </p>
        <p className="text-sm text-[#52525B] mb-10">
          Économisez jusqu'à 6 000€/mois en remplaçant votre agence social media et votre cabinet de recrutement.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 gold-gradient text-[#0A0A0B] text-lg font-semibold px-10 py-4 rounded-full hover:brightness-110 transition-all duration-200 hover:shadow-[0_0_60px_rgba(212,168,83,0.3)]"
        >
          <Sparkles size={20} />
          Lancer gratuitement
        </Link>
        <p className="text-xs text-[#52525B] mt-6 uppercase tracking-wider">
          Sans engagement. Annulation à tout moment.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-white/5 py-12 px-6" style={{ background: 'rgba(10, 10, 11, 0.8)' }}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-extrabold text-[#D4A853]" style={{ fontFamily: 'var(--font-heading)' }}>
            LNR
          </span>
          <span className="text-sm font-medium text-[#FAFAFA]">AI HUB</span>
          <span className="text-xs text-[#52525B] ml-3">© 2025 LNR Finance. Tous droits réservés.</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-[#52525B]">
          <a href="#" className="hover:text-[#A1A1AA] transition-colors">Mentions légales</a>
          <a href="#" className="hover:text-[#A1A1AA] transition-colors">Politique de confidentialité</a>
          <a href="#" className="hover:text-[#A1A1AA] transition-colors">CGU</a>
        </div>
        <div className="flex items-center gap-4 text-xs text-[#52525B]">
          <span className="flex items-center gap-1"><Mail size={12} /> contact@lnr-finance.com</span>
          <span className="flex items-center gap-1"><Phone size={12} /> +33 7 52 97 62 77</span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="relative z-10">
      <Navbar />
      <HeroSection />
      <NoraSection />
      <LeoSection />
      <FeaturesSection />
      <TemplatesSection />
      <CTASection />
      <Footer />
    </div>
  );
}
