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

/* Shared label + value renderer used in ProfileCard and exported for Results */
export function LabeledField({ label, value, labelColorClass = 'text-text-dim' }) {
  if (!value) return null;
  return (
    <div>
      <span className={`text-xs font-semibold ${labelColorClass} uppercase tracking-wide`}>{label}: </span>
      <span className="text-text leading-relaxed text-sm">{value}</span>
    </div>
  );
}

/* Renders a nested-field section (e.g. Core Fear, Red Flags) with an icon/heading and sub-fields */
function NestedFieldSection({ data, title, Icon, fields, delay, containerClass, iconClass, headingClass, labelColorClass }) {
  if (!data) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={containerClass}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-4 h-4 ${iconClass}`} />
        <h3 className={`text-sm font-medium ${headingClass} uppercase tracking-wide`}>
          {title}
        </h3>
      </div>
      <div className="space-y-3">
        {fields.map(({ label, key }) => (
          <LabeledField key={key} label={label} value={data[key]} labelColorClass={labelColorClass} />
        ))}
      </div>
    </motion.div>
  );
}

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
      <NestedFieldSection
        data={profile.coreFear}
        title="Core Fear"
        Icon={ShieldAlert}
        fields={[
          { label: 'Primary', key: 'primary' },
          { label: 'Secondary', key: 'secondary' },
          { label: 'Interaction', key: 'interaction' },
        ]}
        delay={(sectionConfig.length + 1) * 0.1}
        containerClass="mb-6 p-6 rounded-2xl bg-surface/40 border border-surface-light/30 hover:border-surface-light/60 transition-all duration-300"
        iconClass={colors.text}
        headingClass="text-text-dim"
        labelColorClass="text-text-dim"
      />

      {/* Red Flags */}
      <NestedFieldSection
        data={profile.redFlags}
        title="Red Flags"
        Icon={Flag}
        fields={[
          { label: 'In Themselves', key: 'inThemselves' },
          { label: 'In Others', key: 'inOthers' },
        ]}
        delay={(sectionConfig.length + 2) * 0.1}
        containerClass="mb-6 p-6 rounded-2xl bg-rose/5 border border-rose/20 hover:border-rose/40 transition-all duration-300"
        iconClass="text-rose"
        headingClass="text-rose"
        labelColorClass="text-rose"
      />

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
