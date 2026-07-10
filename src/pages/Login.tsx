import { Sparkles, Shield, Lock, ExternalLink } from "lucide-react";
import { Link } from "react-router";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: 'rgba(10,10,11,0.95)' }}>
      {/* Decorative orbs */}
      <div className="absolute top-1/4 -left-32 w-[400px] h-[400px] rounded-full opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(212,168,83,0.3) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      <div className="absolute bottom-1/4 -right-32 w-[350px] h-[350px] rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(212,168,83,0.25) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <span className="text-2xl font-extrabold text-[#D4A853] gold-glow-text transition-all" style={{ fontFamily: 'var(--font-heading)' }}>LNR</span>
            <span className="text-lg font-medium text-[#FAFAFA]" style={{ fontFamily: 'var(--font-heading)' }}>AI HUB</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#FAFAFA] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Connectez-vous
          </h1>
          <p className="text-sm text-[#52525B]">
            Accédez à vos agents IA Communication et RH
          </p>
        </div>

        {/* Login card */}
        <div className="glass-card p-8">
          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2 rounded-full"
            style={{ background: 'rgba(34, 197, 94, 0.06)', border: '1px solid rgba(34, 197, 94, 0.15)' }}>
            <Lock size={12} className="text-[#22C55E]" />
            <span className="text-xs text-[#22C55E] font-medium">Connexion sécurisée OAuth 2.0</span>
          </div>

          {/* Login button */}
          <button
            onClick={() => { window.location.href = getOAuthUrl(); }}
            className="w-full btn-gold h-12 rounded-xl flex items-center justify-center gap-3 text-sm font-semibold"
          >
            <span className="relative z-10 flex items-center gap-3">
              <Sparkles size={18} />
              Se connecter avec Kimi
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-[#3F3F46]">ou</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Back to home */}
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-white/[0.06] text-sm text-[#52525B] hover:text-[#A1A1AA] hover:border-white/[0.1] transition-all"
          >
            <ExternalLink size={14} />
            Retour à l'accueil
          </Link>

          {/* Info */}
          <div className="mt-6 pt-5 border-t border-white/[0.04] space-y-2">
            <div className="flex items-start gap-2">
              <Shield size={12} className="text-[#D4A853] mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-[#3F3F46] leading-relaxed">
                Vos données sont chiffrées. Nous ne stockons jamais vos mots de passe.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Lock size={12} className="text-[#D4A853] mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-[#3F3F46] leading-relaxed">
                Session sécurisée avec expiration automatique après 7 jours.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-[#3F3F46] mt-6">
          © 2025 LNR Finance · <Link to="/" className="text-[#52525B] hover:text-[#A1A1AA] transition-colors">Politique de confidentialité</Link>
        </p>
      </div>
    </div>
  );
}
