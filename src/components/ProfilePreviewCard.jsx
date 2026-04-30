import { motion } from 'framer-motion';
import { Trash2, User, Check } from 'lucide-react';

export default function ProfilePreviewCard({ profile, onSelect, onDelete, selected }) {
  const moduleCount = profile.enabledModules?.length || 0;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect?.(profile)}
      className={`relative bg-surface/40 border rounded-xl p-4 transition-all duration-200 ${
        selected
          ? 'border-accent/60 ring-1 ring-accent/20'
          : 'border-surface-light/50 hover:border-surface-light'
      } ${onSelect ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
            selected ? 'bg-accent/20 border border-accent/40' : 'bg-surface border border-surface-light'
          }`}>
            {selected ? (
              <Check className="w-4 h-4 text-accent" />
            ) : (
              <User className="w-4 h-4 text-text-dim" />
            )}
          </div>
          <div>
            <h3 className="text-base font-medium text-text">{profile.name || 'Unnamed'}</h3>
            <p className="text-xs text-text-faint capitalize">{profile.gender || 'No gender'}</p>
          </div>
        </div>

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Delete profile "${profile.name}"?`)) {
                onDelete(profile.id);
              }
            }}
            className="p-1.5 rounded-lg text-text-faint hover:text-rose hover:bg-rose/10 transition-colors cursor-pointer"
            title="Delete profile"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-xs text-accent">
          Core
        </span>
        {moduleCount > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface border border-surface-light text-xs text-text-dim">
            +{moduleCount} depth {moduleCount === 1 ? 'module' : 'modules'}
          </span>
        )}
      </div>

      {profile.createdAt && (
        <p className="mt-2 text-xs text-text-faint">
          {new Date(profile.createdAt).toLocaleDateString()}
        </p>
      )}
    </motion.div>
  );
}
