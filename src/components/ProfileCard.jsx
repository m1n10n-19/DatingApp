import { motion } from 'framer-motion';
import { Fingerprint, Brain, Eye, Heart, AlertCircle, Sprout, BookOpen, MessageCircle, ShieldAlert, Flag } from 'lucide-react';

const sectionConfig = [
  { key: 'archetype', label: 'Archetype', icon: Fingerprint, isTitle: true },
  { key: 'coreWiring', label: 'Core Wiring', icon: Brain },
  { key: 'shadowPattern', label: 'Shadow Pattern', icon: Eye },
  { key: 'loveTemplate', label: 'Love Template', icon: Heart },
  { key: 'complementProfile', label: 'Complement Profile', icon: BookOpen },
  { key: 'likelyMistake', label: 'Likely Mistake', icon: AlertCircle },
  { key: 'growthEdge', label: 'Growth Edge', icon: Sprout },
];

export default function ProfileCard({ profile, color }) {
  const colorClasses = {
    accent: {
      border: 'border-accent/20',
      bg: 'bg-accent/5',
      text: 'text-accent',
      glow: 'shadow-accent/5',
    },
    rose: {
      border: 'border-rose/20',
      bg: 'bg-rose/5',
      text: 'text-rose',
      glow: 'shadow-rose/5',
    },
  };

  const colors = colorClasses[color] || colorClasses.accent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {sectionConfig.map((section, index) => {
        const Icon = section.icon;
        const value = profile[section.key];

        if (section.isTitle) {
          return (
            <motion.div
              key={section.key}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center mb-10"
            >
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${colors.bg} border ${colors.border} mb-4`}>
                <Icon className={`w-4 h-4 ${colors.text}`} />
                <span className="text-sm text-text-dim">{section.label}</span>
              </div>
              <h2 className={`font-serif text-3xl md:text-4xl font-bold ${colors.text}`}>
                {value}
              </h2>
            </motion.div>
          );
        }

        return (
          <motion.div
            key={section.key}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`mb-6 p-6 rounded-2xl bg-surface/40 border border-surface-light/30 hover:border-surface-light/60 transition-all duration-300`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`w-4 h-4 ${colors.text}`} />
              <h3 className="text-sm font-medium text-text-dim uppercase tracking-wide">
                {section.label}
              </h3>
            </div>
            <p className="text-text leading-relaxed">{value}</p>
          </motion.div>
        );
      })}

      {/* Core Fear */}
      {profile.coreFear && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (sectionConfig.length + 1) * 0.1 }}
          className="mb-6 p-6 rounded-2xl bg-surface/40 border border-surface-light/30 hover:border-surface-light/60 transition-all duration-300"
        >
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className={`w-4 h-4 ${colors.text}`} />
            <h3 className="text-sm font-medium text-text-dim uppercase tracking-wide">
              Core Fear
            </h3>
          </div>
          <div className="space-y-3">
            {profile.coreFear.primary && (
              <div>
                <span className="text-xs font-semibold text-text-dim uppercase tracking-wide">Primary: </span>
                <span className="text-text leading-relaxed text-sm">{profile.coreFear.primary}</span>
              </div>
            )}
            {profile.coreFear.secondary && (
              <div>
                <span className="text-xs font-semibold text-text-dim uppercase tracking-wide">Secondary: </span>
                <span className="text-text leading-relaxed text-sm">{profile.coreFear.secondary}</span>
              </div>
            )}
            {profile.coreFear.interaction && (
              <div>
                <span className="text-xs font-semibold text-text-dim uppercase tracking-wide">Interaction: </span>
                <span className="text-text leading-relaxed text-sm">{profile.coreFear.interaction}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Red Flags */}
      {profile.redFlags && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (sectionConfig.length + 2) * 0.1 }}
          className="mb-6 p-6 rounded-2xl bg-rose/5 border border-rose/20 hover:border-rose/40 transition-all duration-300"
        >
          <div className="flex items-center gap-2 mb-4">
            <Flag className="w-4 h-4 text-rose" />
            <h3 className="text-sm font-medium text-rose uppercase tracking-wide">
              Red Flags
            </h3>
          </div>
          <div className="space-y-3">
            {profile.redFlags.inThemselves && (
              <div>
                <span className="text-xs font-semibold text-rose uppercase tracking-wide">In Themselves: </span>
                <span className="text-text leading-relaxed text-sm">{profile.redFlags.inThemselves}</span>
              </div>
            )}
            {profile.redFlags.inOthers && (
              <div>
                <span className="text-xs font-semibold text-rose uppercase tracking-wide">In Others: </span>
                <span className="text-text leading-relaxed text-sm">{profile.redFlags.inOthers}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Closing Line */}
      {profile.closingLine && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (sectionConfig.length + 3) * 0.1 }}
          className={`mt-8 p-6 rounded-2xl bg-gradient-to-r ${color === 'rose' ? 'from-rose/5 to-rose/10' : 'from-accent/5 to-accent/10'} border ${colors.border} text-center`}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <MessageCircle className={`w-4 h-4 ${colors.text}`} />
            <h3 className="text-sm font-medium text-text-dim uppercase tracking-wide">
              In One Line
            </h3>
          </div>
          <p className={`text-text leading-relaxed italic font-medium`}>
            {profile.closingLine}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
