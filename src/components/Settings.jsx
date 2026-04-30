import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Key, Check, Eye, EyeOff, ExternalLink } from 'lucide-react';

const PROVIDERS = [
  {
    id: 'groq',
    name: 'Groq',
    envKey: 'GROQ_API_KEY',
    placeholder: 'gsk_...',
    docsUrl: 'https://console.groq.com/keys',
    description: 'Fast inference with Llama, Mixtral, Gemma models',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    envKey: 'OPENAI_API_KEY',
    placeholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    description: 'GPT-4o, GPT-4 Turbo',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    envKey: 'GEMINI_API_KEY',
    placeholder: 'AI...',
    docsUrl: 'https://aistudio.google.com/apikey',
    description: 'Gemini 2.0 Flash, Gemini 1.5 Pro',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    envKey: 'ANTHROPIC_API_KEY',
    placeholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    description: 'Claude Sonnet 4, Claude 3.5 Sonnet',
  },
];

export default function Settings({ onBack }) {
  const [keys, setKeys] = useState({});
  const [visibility, setVisibility] = useState({});
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState({});
  const [available, setAvailable] = useState({});

  // Fetch current availability status
  useEffect(() => {
    fetch('/api/models')
      .then((r) => r.json())
      .then((data) => {
        const avail = {};
        data.forEach((p) => { avail[p.id] = p.available; });
        setAvailable(avail);
      })
      .catch(() => {});
  }, [saved]);

  const handleSave = async (providerId, envKey) => {
    const value = keys[providerId]?.trim();
    if (!value) return;

    setSaving(providerId);
    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: envKey, value }),
      });

      if (response.ok) {
        setSaved((prev) => ({ ...prev, [providerId]: true }));
        setKeys((prev) => ({ ...prev, [providerId]: '' }));
        setTimeout(() => setSaved((prev) => ({ ...prev, [providerId]: false })), 3000);
      }
    } catch {
      // silently fail
    }
    setSaving(null);
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-dim hover:text-text transition-colors mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Key className="w-5 h-5 text-accent" />
            <h1 className="font-serif text-3xl font-bold text-text">API Keys</h1>
          </div>
          <p className="text-text-dim text-sm">
            Configure API keys to unlock different AI providers. Keys are stored on the server only and never sent to the browser.
          </p>
        </div>

        <div className="space-y-4">
          {PROVIDERS.map((provider) => (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-surface/40 border border-surface-light/30"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-text">{provider.name}</h3>
                <div className="flex items-center gap-2">
                  {available[provider.id] && (
                    <span className="flex items-center gap-1 text-xs text-sage bg-sage/10 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" />
                      Active
                    </span>
                  )}
                  <a
                    href={provider.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-text-faint hover:text-accent flex items-center gap-1 transition-colors"
                  >
                    Get key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <p className="text-xs text-text-faint mb-3">{provider.description}</p>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={visibility[provider.id] ? 'text' : 'password'}
                    value={keys[provider.id] || ''}
                    onChange={(e) => setKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))}
                    placeholder={provider.placeholder}
                    className="w-full bg-midnight/60 border border-surface-light/50 rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-accent/50 transition-all pr-10"
                  />
                  <button
                    onClick={() => setVisibility((prev) => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-dim transition-colors cursor-pointer"
                  >
                    {visibility[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={() => handleSave(provider.id, provider.envKey)}
                  disabled={!keys[provider.id]?.trim() || saving === provider.id}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    saved[provider.id]
                      ? 'bg-sage/20 text-sage border border-sage/30'
                      : keys[provider.id]?.trim()
                        ? 'bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30'
                        : 'bg-surface/60 text-text-faint border border-surface-light/30 cursor-not-allowed'
                  }`}
                >
                  {saved[provider.id] ? 'Saved' : saving === provider.id ? '...' : 'Save'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
