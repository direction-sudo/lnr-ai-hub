import { useState } from 'react';
import { Key, X, Check, AlertCircle } from 'lucide-react';
import { hasApiKey, setApiKey, getApiKey } from '@/lib/ai-service';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [key, setKey] = useState(getApiKey() || '');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (key.trim()) {
      setApiKey(key.trim());
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1500);
    }
  };

  const handleClear = () => {
    localStorage.removeItem('lnr_api_key');
    setKey('');
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const configured = hasApiKey();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md glass-card p-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(212,168,83,0.1)] border border-[rgba(212,168,83,0.2)] flex items-center justify-center">
              <Key size={18} className="text-[#D4A853]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#FAFAFA]">Configuration API</h3>
              <p className="text-xs text-[#52525B]">Clé API Kimi / Moonshot AI</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#3F3F46] hover:text-[#FAFAFA] hover:bg-white/[0.05] transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Status */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-4 text-xs font-medium ${
          configured
            ? 'bg-[rgba(34,197,94,0.08)] text-[#22C55E] border border-[rgba(34,197,94,0.15)]'
            : 'bg-[rgba(245,158,11,0.08)] text-[#F59E0B] border border-[rgba(245,158,11,0.15)]'
        }`}>
          {configured ? <Check size={13} /> : <AlertCircle size={13} />}
          {configured
            ? 'Clé API configurée — IA réelle active'
            : 'Pas de clé API — Mode simulation activé'}
        </div>

        {/* Info */}
        <div className="mb-4 p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-white/[0.04]">
          <p className="text-xs text-[#52525B] leading-relaxed">
            Sans clé API, Nora et Leo utilisent le mode simulation avec des réponses pré-écrites.
            Avec une clé API, ils utilisent l'IA Kimi pour des réponses intelligentes et personnalisées.
          </p>
        </div>

        {/* Input */}
        <div className="mb-4">
          <label className="text-xs text-[#52525B] font-medium mb-1.5 block">Clé API (sk-...)</label>
          <input
            type="password"
            value={key}
            onChange={e => { setKey(e.target.value); setSaved(false); }}
            placeholder="sk-xxxxxxxxxxxxxxxx"
            className="w-full h-11 bg-[#18181B] border border-white/[0.06] rounded-xl px-4 text-sm text-[#FAFAFA] placeholder-[#3F3F46] focus:outline-none focus:border-[#D4A853]/40 transition-all font-mono"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!key.trim() || saved}
            className="flex-1 btn-gold h-10 rounded-xl text-sm font-semibold disabled:opacity-40"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {saved ? <><Check size={14} /> Sauvegardé !</> : <>Sauvegarder</>}
            </span>
          </button>
          {configured && (
            <button
              onClick={handleClear}
              className="h-10 px-4 rounded-xl text-xs font-medium text-[#EF4444] border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.06)] transition-all"
            >
              Supprimer
            </button>
          )}
        </div>

        {/* How to get key */}
        <div className="mt-5 pt-4 border-t border-white/[0.04]">
          <p className="text-[11px] text-[#3F3F46] font-medium mb-2">Comment obtenir une clé API :</p>
          <ol className="space-y-1.5 text-[11px] text-[#52525B]">
            <li className="flex items-start gap-2">
              <span className="text-[#D4A853] font-bold flex-shrink-0">1.</span>
              <span>Allez sur <a href="https://platform.kimi.ai/console/api-keys" target="_blank" rel="noopener noreferrer" className="text-[#D4A853] hover:underline">platform.kimi.ai</a></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D4A853] font-bold flex-shrink-0">2.</span>
              <span>Connectez-vous avec votre compte</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D4A853] font-bold flex-shrink-0">3.</span>
              <span>Cliquez sur "Create New Key" et copiez la clé</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D4A853] font-bold flex-shrink-0">4.</span>
              <span>Rechargez des crédits si nécessaire (Billing)</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
