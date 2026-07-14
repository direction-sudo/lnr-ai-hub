import { useState } from 'react';
import { X, Key, ExternalLink, Check, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (token: string, pageId: string, pageName: string) => void;
}

export default function ConnectFacebookModal({ isOpen, onClose, onConnect }: Props) {
  const [token, setToken] = useState('');
  const [pageId, setPageId] = useState('');
  const [pageName, setPageName] = useState('');
  const [step, setStep] = useState<'info' | 'token'>('info');
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);

  if (!isOpen) return null;

  const testToken = async (): Promise<boolean> => {
    if (!token.trim()) return false;
    setTesting(true);
    setError('');

    try {
      // Test 1: Check token validity and get pages
      const res = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${token.trim()}&fields=name,id,access_token`);
      const data = await res.json() as { data?: Array<{ name: string; id: string; access_token: string }>; error?: { message: string } };

      if (data.error) {
        setError(`Token invalide : ${data.error.message}`);
        setTesting(false);
        return false;
      }

      if (!data.data || data.data.length === 0) {
        setError('Aucune page Facebook trouvée. Assurez-vous d\'avoir un token avec les permissions pages_manage_posts et pages_read_engagement.');
        setTesting(false);
        return false;
      }

      // Auto-fill page info if not provided
      const page = data.data[0];
      if (!pageId.trim()) setPageId(page.id);
      if (!pageName.trim()) setPageName(page.name);

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

    // Test token first
    const valid = await testToken();
    if (!valid) return;

    // If pageId still empty after test, require it
    if (!pageId.trim()) {
      setError('Le Page ID est requis.');
      return;
    }

    onConnect(token.trim(), pageId.trim(), pageName.trim() || 'Ma Page');
    setToken('');
    setPageId('');
    setPageName('');
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
            <div className="w-10 h-10 rounded-xl bg-[#1877F2]/20 border border-[#1877F2]/30 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#FAFAFA]">Connecter Facebook</h3>
              <p className="text-xs text-[#52525B]">Publiez sur votre Page Facebook et Instagram</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#3F3F46] hover:text-[#FAFAFA] hover:bg-white/[0.05] transition-all">
            <X size={16} />
          </button>
        </div>

        {step === 'info' ? (
          <>
            {/* Info step */}
            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-xl bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.15)]">
                <p className="text-xs text-[#F59E0B] flex items-start gap-2">
                  <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                  <strong>Attention :</strong> Le token que vous avez actuellement (format <code>app_id|secret</code>) est un App Token. Il ne permet PAS de publier. Il vous faut un <strong>Page Access Token</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[rgba(24,119,242,0.08)] border border-[rgba(24,119,242,0.15)]">
                <h4 className="text-sm font-semibold text-[#FAFAFA] mb-2 flex items-center gap-2">
                  <AlertCircle size={14} className="text-[#1877F2]" />
                  Comment obtenir votre Page Access Token
                </h4>
                <ol className="space-y-2 text-xs text-[#A1A1AA]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#1877F2] font-bold flex-shrink-0">1.</span>
                    <span>Allez sur <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-[#1877F2] hover:underline inline-flex items-center gap-1">Graph API Explorer <ExternalLink size={10}/></a></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#1877F2] font-bold flex-shrink-0">2.</span>
                    <span>Dans le dropdown "Application", sélectionnez <strong>"LNR AI Hub"</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#1877F2] font-bold flex-shrink-0">3.</span>
                    <span>Cliquez sur <strong>"Generate Access Token"</strong> et connectez-vous</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#1877F2] font-bold flex-shrink-0">4.</span>
                    <span>Cliquez sur l'icône ⚙️ (Add a Permission) et cochez :<br/><code className="text-[#D4A853]">pages_manage_posts</code>, <code className="text-[#D4A853]">pages_read_engagement</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#1877F2] font-bold flex-shrink-0">5.</span>
                    <span>Dans le champ de requête, tapez : <code className="text-[#D4A853]">GET /me/accounts?fields=name,id,access_token</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#1877F2] font-bold flex-shrink-0">6.</span>
                    <span>Cliquez <strong>"Submit"</strong> — copiez le <code className="text-[#D4A853]">access_token</code> de votre page</span>
                  </li>
                </ol>
              </div>

              <div className="p-3 rounded-xl bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.15)]">
                <p className="text-xs text-[#F59E0B] flex items-start gap-2">
                  <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                  Pour Instagram, votre compte doit être un <strong>compte Business</strong> lié à votre Page Facebook.
                </p>
              </div>
            </div>

            <button
              onClick={() => { setStep('token'); setError(''); }}
              className="w-full btn-gold h-11 rounded-xl text-sm font-semibold"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Key size={15} /> J'ai mon Page Access Token
              </span>
            </button>
          </>
        ) : (
          <>
            {/* Token input step */}
            <div className="space-y-4 mb-6">
              {error && (
                <div className="p-3 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] text-xs text-[#EF4444]">
                  {error}
                </div>
              )}

              <div>
                <label className="text-xs text-[#52525B] font-medium mb-1.5 block">Page Access Token (EAA...)</label>
                <textarea
                  value={token}
                  onChange={e => { setToken(e.target.value); setError(''); }}
                  placeholder="EAAxxxxxxxx..."
                  rows={2}
                  className="w-full bg-[#18181B] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#1877F2]/40 transition-all font-mono resize-none"
                />
                <p className="text-[11px] text-[#3F3F46] mt-1">
                  Ce token commence par <strong>EAA</strong> (pas par votre App ID)
                </p>
              </div>

              <div>
                <label className="text-xs text-[#52525B] font-medium mb-1.5 block">Page ID Facebook</label>
                <input
                  type="text"
                  value={pageId}
                  onChange={e => setPageId(e.target.value)}
                  placeholder="123456789012345"
                  className="w-full h-10 bg-[#18181B] border border-white/[0.06] rounded-xl px-4 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#1877F2]/40 transition-all font-mono"
                />
                <p className="text-[11px] text-[#3F3F46] mt-1">
                  Trouvé via /me/accounts dans le Graph API Explorer
                </p>
              </div>

              <div>
                <label className="text-xs text-[#52525B] font-medium mb-1.5 block">Nom de la page (optionnel)</label>
                <input
                  type="text"
                  value={pageName}
                  onChange={e => setPageName(e.target.value)}
                  placeholder="LNR Finance"
                  className="w-full h-10 bg-[#18181B] border border-white/[0.06] rounded-xl px-4 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#1877F2]/40 transition-all"
                />
              </div>
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
