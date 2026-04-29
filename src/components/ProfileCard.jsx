import { motion } from 'framer-motion';
import { Fingerprint, Brain, Eye, Heart, AlertCircle } from 'lucide-react';

const sectionConfig = [
  { key: 'archetype', label: 'Archetype', icon: Fingerprint, isTitle: true },
  { key: 'coreWiring', label: 'Core Wiring', icon: Brain },
  { key: 'shadowPattern', label: 'Shadow Pattern', icon: Eye },
  { key: 'complementProfile', label: 'Complement Profile', icon: Heart },
  { key: 'likelyMistake', label: 'Likely Mistake', icon: AlertCircle },
];

export default function ProfileCard({ data, name, color }) {
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
        const value = data[section.key];

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
    </motion.div>
  );
}
