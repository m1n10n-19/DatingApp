import { motion } from 'framer-motion';
import { Zap, Flame, Copy, XCircle, TrendingUp, TrendingDown, AlertTriangle, Quote } from 'lucide-react';

const verdictConfig = {
  COMPLEMENT: {
    icon: Zap,
    color: 'text-sage',
    bg: 'bg-sage/10',
    border: 'border-sage/20',
    label: 'Complement',
    description: 'Different architectures that complete each other.',
  },
  COMBUSTION: {
    icon: Flame,
    color: 'text-warm',
    bg: 'bg-warm/10',
    border: 'border-warm/20',
    label: 'Combustion',
    description: 'Intense attraction, fundamental incompatibility.',
  },
  MIRROR: {
    icon: Copy,
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
    label: 'Mirror',
    description: 'Similar architectures. Deep recognition, risk of stagnation.',
  },
  MISFIRE: {
    icon: XCircle,
    color: 'text-rose',
    bg: 'bg-rose/10',
    border: 'border-rose/20',
    label: 'Misfire',
    description: 'Fundamental misalignment. Not bad people — wrong fit.',
  },
};

export default function CompatibilitySection({ compatibility }) {
  const verdict = verdictConfig[compatibility.verdict] || verdictConfig.COMPLEMENT;
  const VerdictIcon = verdict.icon;
  const warnings = Array.isArray(compatibility.earlyWarnings) ? compatibility.earlyWarnings : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Verdict + Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-12"
      >
        <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full ${verdict.bg} border ${verdict.border} mb-6`}>
          <VerdictIcon className={`w-5 h-5 ${verdict.color}`} />
          <span className={`text-lg font-semibold ${verdict.color}`}>{verdict.label}</span>
        </div>

        <p className="text-text-dim text-sm mb-8">{verdict.description}</p>

        {/* Score ring */}
        <div className="relative w-36 h-36 mx-auto mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-surface-light/30"
            />
            <motion.circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - (compatibility.score ?? 0) / 100) }}
              transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-accent)" />
                <stop offset="100%" stopColor="var(--color-rose)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-4xl font-bold text-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {compatibility.score ?? 0}
            </motion.span>
            <span className="text-xs text-text-faint uppercase tracking-wider">Score</span>
          </div>
        </div>
      </motion.div>

      {/* Dynamic */}
      <Section
        title="The Dynamic"
        icon={<Zap className="w-4 h-4 text-accent" />}
        delay={0.2}
      >
        <p className="text-text leading-relaxed">{compatibility.dynamic}</p>
      </Section>

      {/* Breaking Point */}
      <Section
        title="Breaking Point"
        icon={<AlertTriangle className="w-4 h-4 text-warm" />}
        delay={0.3}
      >
        <p className="text-text leading-relaxed">{compatibility.breakingPoint}</p>
      </Section>

      {/* Best Case / Worst Case */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Section
          title="Best Case"
          icon={<TrendingUp className="w-4 h-4 text-sage" />}
          delay={0.4}
          compact
        >
          <p className="text-text leading-relaxed text-sm">{compatibility.bestCase}</p>
        </Section>

        <Section
          title="Worst Case"
          icon={<TrendingDown className="w-4 h-4 text-rose" />}
          delay={0.5}
          compact
        >
          <p className="text-text leading-relaxed text-sm">{compatibility.worstCase}</p>
        </Section>
      </div>

      {/* Early Warning Signs */}
      {warnings.length > 0 && (
        <Section
          title="Early Warning Signs"
          icon={<AlertTriangle className="w-4 h-4 text-warm" />}
          delay={0.6}
        >
          <div className="space-y-3">
            {warnings.map((warning, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-warm/10 border border-warm/20 flex items-center justify-center text-xs text-warm font-medium mt-0.5">
                  {i + 1}
                </span>
                <p className="text-text leading-relaxed text-sm">{warning}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Closing Line */}
      {compatibility.closingLine && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12 text-center"
        >
          <Quote className="w-6 h-6 text-accent/40 mx-auto mb-4" />
          <p className="font-serif text-xl md:text-2xl text-text italic leading-relaxed max-w-xl mx-auto">
            &ldquo;{compatibility.closingLine}&rdquo;
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

function Section({ title, icon, children, delay = 0, compact = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`${compact ? '' : 'mb-6'} p-6 rounded-2xl bg-surface/40 border border-surface-light/30 hover:border-surface-light/60 transition-all duration-300`}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-medium text-text-dim uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}
