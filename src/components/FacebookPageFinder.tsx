import { useState } from 'react';
import { X, Search, Loader2, Check, AlertCircle, Copy, ExternalLink } from 'lucide-react';

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectPage: (token: string, pageId: string, pageName: string) => void;
}

export default function FacebookPageFinder({ isOpen, onClose, onSelectPage }: Props) {
  const [userToken, setUserToken] = useState('');
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!userToken.trim()) {
      setError('Collez votre token utilisateur');
      return;
    }
    setLoading(true);
    setError('');
    setSearched(true);

    try {
      // Step 1: Get pages from user token
      const res = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${userToken.trim()}&fields=name,id,access_token,category`
      );
      const data = await res.json();

      if (data.error) {
        setError(`Erreur : ${data.error.message}`);
        setPages([]);
        setLoading(false);
        return;
      }

      if (!data.data || data.data.length === 0) {
        setError('Aucune page trouvée. Vérifiez que votre token a les permissions pages_read_engagement.');
        setPages([]);
        setLoading(false);
        return;
      }

      setPages(data.data);
    } catch (err) {
      setError('Erreur réseau. Vérifiez votre connexion.');
    }

    setLoading(false);
  };

  const handleSelect = (page: FacebookPage) => {
    onSelectPage(page.access_token, page.id, page.name);
    // Reset
    setUserToken('');
    setPages([]);
    setSearched(false);
    setError('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
              <h3 className="text-base font-bold text-[#FAFAFA]">Trouver ma Page Facebook</h3>
              <p className="text-xs text-[#52525B]">Récupération automatique du Page ID</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#3F3F46] hover:text-[#FAFAFA]">
            <X size={16} />
          </button>
        </div>

        {/* Step 1: Get user token */}
        {!searched && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[rgba(24,119,242,0.08)] border border-[rgba(24,119,242,0.15)]">
              <h4 className="text-sm font-semibold text-[#FAFAFA] mb-3">Étape 1 : Obtenir un token utilisateur</h4>
              <ol className="space-y-2 text-xs text-[#A1A1AA]">
                <li className="flex items-start gap-2">
                  <span className="text-[#1877F2] font-bold flex-shrink-0">1.</span>
                  <span>Allez sur <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-[#1877F2] hover:underline inline-flex items-center gap-1">Graph API Explorer <ExternalLink size={10}/></a></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1877F2] font-bold flex-shrink-0">2.</span>
                  <span>Sélectionnez votre app <strong>"LNR AI Hub"</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1877F2] font-bold flex-shrink-0">3.</span>
                  <span>Cliquez sur <strong>"Generate Access Token"</strong> et connectez-vous</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1877F2] font-bold flex-shrink-0">4.</span>
                  <span>Cliquez ⚙️ (Add Permission), cochez :<br/><code className="text-[#D4A853]">pages_read_engagement</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1877F2] font-bold flex-shrink-0">5.</span>
                  <span><strong>Copiez</strong> le token généré (commence par EAA...)</span>
                </li>
              </ol>
            </div>

            <div>
              <label className="text-xs text-[#52525B] font-medium mb-1.5 block">Collez votre token ici</label>
              <textarea
                value={userToken}
                onChange={e => { setUserToken(e.target.value); setError(''); }}
                placeholder="EAAxxxxxxxx..."
                rows={2}
                className="w-full bg-[#18181B] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#1877F2]/40 transition-all font-mono resize-none"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] text-xs text-[#EF4444]">
                {error}
              </div>
            )}

            <button
              onClick={handleSearch}
              disabled={!userToken.trim() || loading}
              className="w-full btn-gold h-11 rounded-xl text-sm font-semibold disabled:opacity-40"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? <><Loader2 size={14} className="animate-spin" /> Recherche...</> : <><Search size={15} /> Trouver mes pages</>}
              </span>
            </button>
          </div>
        )}

        {/* Step 2: Select page */}
        {searched && !loading && pages.length > 0 && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.15)]">
              <p className="text-sm text-[#22C55E] font-medium flex items-center gap-2">
                <Check size={14} /> {pages.length} page(s) trouvée(s)
              </p>
            </div>

            <div className="space-y-2">
              {pages.map(page => (
                <button
                  key={page.id}
                  onClick={() => handleSelect(page)}
                  className="w-full glass-card p-4 text-left hover:bg-[rgba(255,255,255,0.03)] transition-all border border-transparent hover:border-[rgba(212,168,83,0.2)] group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#FAFAFA] group-hover:text-[#D4A853] transition-colors">
                        {page.name}
                      </p>
                      <p className="text-[11px] text-[#52525B] font-mono mt-0.5">ID: {page.id}</p>
                      {page.category && (
                        <p className="text-[10px] text-[#3F3F46] mt-0.5">{page.category}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(page.id); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#3F3F46] hover:text-[#FAFAFA] hover:bg-white/[0.05] transition-all"
                        title="Copier le Page ID"
                      >
                        <Copy size={13} />
                      </button>
                      <div className="w-8 h-8 rounded-full bg-[rgba(212,168,83,0.1)] flex items-center justify-center">
                        <Check size={14} className="text-[#D4A853]" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => { setSearched(false); setPages([]); setError(''); }}
              className="w-full text-xs text-[#52525B] hover:text-[#FAFAFA] py-2 transition-colors"
            >
              ← Retour, utiliser un autre token
            </button>
          </div>
        )}

        {/* Error state */}
        {searched && !loading && error && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)]">
              <p className="text-sm text-[#EF4444] flex items-start gap-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                {error}
              </p>
            </div>

            <button
              onClick={() => { setSearched(false); setError(''); }}
              className="w-full text-xs text-[#52525B] hover:text-[#FAFAFA] py-2 transition-colors"
            >
              ← Réessayer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
