import { motion } from 'framer-motion';

const phases = [
  'Reading between the lines...',
  'Mapping personality architecture...',
  'Identifying shadow patterns...',
  'Calculating complement profiles...',
  'Building compatibility analysis...',
];

export default function Analyzing({ personA, personB }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-lg">
        {/* Animated orb */}
        <div className="relative w-32 h-32 mx-auto mb-12">
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/30 to-rose/30"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-4 rounded-full bg-gradient-to-br from-accent/40 to-warm/40"
            animate={{
              scale: [1.1, 0.9, 1.1],
              opacity: [0.6, 0.9, 0.6],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          />
          <motion.div
            className="absolute inset-8 rounded-full bg-gradient-to-br from-accent/60 to-rose/60 animate-pulse-glow"
          />
        </div>

        {/* Names */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className="text-lg font-medium text-accent">{personA.name}</span>
          <motion.span
            className="text-text-faint"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            &amp;
          </motion.span>
          <span className="text-lg font-medium text-rose">{personB.name}</span>
        </div>

        {/* Rotating phrases */}
        <div className="h-8 overflow-hidden relative">
          {phases.map((phase, i) => (
            <motion.p
              key={phase}
              className="text-text-dim text-base absolute left-0 right-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: [20, 0, 0, -20],
              }}
              transition={{
                duration: 3,
                delay: i * 3,
                repeat: Infinity,
                repeatDelay: (phases.length - 1) * 3,
                times: [0, 0.1, 0.9, 1],
              }}
            >
              {phase}
            </motion.p>
          ))}
        </div>
      </div>
    </div>
  );
}
