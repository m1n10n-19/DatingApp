import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Cpu, Check, Lock } from 'lucide-react';

export default function ModelSelector({ selectedProvider, selectedModel, onChange }) {
  const [providers, setProviders] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    fetch('/api/models')
      .then((r) => r.json())
      .then((data) => {
        setProviders(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentProvider = providers.find((p) => p.id === selectedProvider);
  const currentModel = currentProvider?.models.find((m) => m.id === selectedModel);

  if (loading) return null;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/60 border border-surface-light/50 text-xs text-text-dim hover:text-text hover:border-surface-light transition-all cursor-pointer"
      >
        <Cpu className="w-3 h-3" />
        <span>{currentProvider?.name || 'Select'}</span>
        <span className="text-text-faint">/</span>
        <span className="text-text">{currentModel?.name || 'Model'}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 bg-deep border border-surface-light rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-surface-light/30">
              <p className="text-xs text-text-faint uppercase tracking-wider font-medium">AI Model</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {providers.map((provider) => (
                <div key={provider.id}>
                  <div className="px-3 pt-3 pb-1 flex items-center gap-2">
                    <span className="text-xs font-semibold text-text-dim uppercase tracking-wider">
                      {provider.name}
                    </span>
                    {!provider.available && (
                      <span className="flex items-center gap-1 text-[10px] text-text-faint bg-surface/60 px-1.5 py-0.5 rounded-full">
                        <Lock className="w-2.5 h-2.5" />
                        No key
                      </span>
                    )}
                  </div>
                  {provider.models.map((model) => {
                    const isSelected = selectedProvider === provider.id && selectedModel === model.id;
                    const isDisabled = !provider.available;
                    return (
                      <button
                        key={`${provider.id}-${model.id}`}
                        onClick={() => {
                          if (!isDisabled) {
                            onChange(provider.id, model.id);
                            setOpen(false);
                          }
                        }}
                        disabled={isDisabled}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors cursor-pointer ${
                          isDisabled
                            ? 'opacity-40 cursor-not-allowed'
                            : isSelected
                              ? 'bg-accent/10 text-accent'
                              : 'text-text hover:bg-surface-light/40'
                        }`}
                      >
                        <span className="text-sm">{model.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-surface-light/30">
              <p className="text-[10px] text-text-faint text-center">
                Add API keys in .env to unlock providers
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
