import { useState } from 'react';
import { X, Key, ExternalLink, Check, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (token: string) => void;
}

export default function ConnectLinkedInModal({ isOpen, onClose, onConnect }: Props) {
  const [token, setToken] = useState('');
  const [step, setStep] = useState<'info' | 'token'>('info');
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);

  if (!isOpen) return null;

  const testToken = async (): Promise<boolean> => {
    if (!token.trim()) return false;
    setTesting(true);
    setError('');

    try {
      // Test: Get user info from LinkedIn
      const res = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      const data = await res.json() as { name?: string; sub?: string; error?: string; error_description?: string };

      if (data.error) {
        setError(`Token invalide : ${data.error_description || data.error}`);
        setTesting(false);
        return false;
      }

      if (!data.sub) {
        setError('Token invalide : impossible de récupérer le profil.');
        setTesting(false);
        return false;
      }

      setTesting(false);
      return true;
    } catch (err) {
      setError('Erreur réseau lors du test du token.');
      setTesting(false);
      return false;
    }
  };

  const handleConnect = async () => {
    setError('');

    if (!token.trim()) {
      setError('Le token est requis.');
      return;
    }

    const valid = await testToken();
    if (!valid) return;

    onConnect(token.trim());
    setToken('');
    setError('');
    setStep('info');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg glass-card p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A66C2]/20 border border-[#0A66C2]/30 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#FAFAFA]">Connecter LinkedIn</h3>
              <p className="text-xs text-[#52525B]">Publiez des posts depuis Nora</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#3F3F46] hover:text-[#FAFAFA] hover:bg-white/[0.05] transition-all">
            <X size={16} />
          </button>
        </div>

        {step === 'info' ? (
          <>
            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-xl bg-[rgba(10,102,194,0.08)] border border-[rgba(10,102,194,0.15)]">
                <h4 className="text-sm font-semibold text-[#FAFAFA] mb-2 flex items-center gap-2">
                  <AlertCircle size={14} className="text-[#0A66C2]" />
                  Comment obtenir votre token LinkedIn
                </h4>
                <ol className="space-y-2 text-xs text-[#A1A1AA]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#0A66C2] font-bold flex-shrink-0">1.</span>
                    <span>Allez sur <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] hover:underline inline-flex items-center gap-1">LinkedIn Developers <ExternalLink size={10}/></a></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0A66C2] font-bold flex-shrink-0">2.</span>
                    <span>Créez une app "LNR AI Hub" et notez le <strong>Client ID</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0A66C2] font-bold flex-shrink-0">3.</span>
                    <span>Dans "Products", demandez : <code className="text-[#D4A853]">Sign In with LinkedIn</code> et <code className="text-[#D4A853]">Share on LinkedIn</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0A66C2] font-bold flex-shrink-0">4.</span>
                    <span>Utilisez l'<a href="https://www.linkedin.com/developers/tools/oauth/token-generator" target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] hover:underline inline-flex items-center gap-1">OAuth Token Generator <ExternalLink size={10}/></a></span>
                  </li>
                </ol>
              </div>

              <div className="p-3 rounded-xl bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.15)]">
                <p className="text-xs text-[#F59E0B] flex items-start gap-2">
                  <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                  Le token expire après 2 mois. Vous devrez le renouveler.
                </p>
              </div>
            </div>

            <button
              onClick={() => { setStep('token'); setError(''); }}
              className="w-full btn-gold h-11 rounded-xl text-sm font-semibold"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Key size={15} /> J'ai mon token d'accès
              </span>
            </button>
          </>
        ) : (
          <>
            {error && (
              <div className="p-3 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] text-xs text-[#EF4444] mb-4">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="text-xs text-[#52525B] font-medium mb-1.5 block">Token d'accès LinkedIn</label>
              <textarea
                value={token}
                onChange={e => { setToken(e.target.value); setError(''); }}
                placeholder="AQV8..."
                rows={3}
                className="w-full bg-[#18181B] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#0A66C2]/40 transition-all font-mono resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleConnect}
                disabled={!token.trim() || testing}
                className="flex-1 btn-gold h-10 rounded-xl text-sm font-semibold disabled:opacity-40"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {testing ? <><Loader2 size={14} className="animate-spin" /> Test en cours...</> : <><Check size={14} /> Connecter</>}
                </span>
              </button>
              <button
                onClick={() => { setStep('info'); setError(''); }}
                className="h-10 px-4 rounded-xl text-xs font-medium text-[#52525B] border border-white/[0.08] hover:bg-white/[0.03] transition-all"
              >
                Retour
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
