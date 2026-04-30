import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';

export default function Landing({ onStart, onQuickTest }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rose/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-warm/3 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center max-w-2xl relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/60 border border-surface-light/50 mb-8"
        >
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm text-text-dim">Personality Architecture Engine</span>
        </motion.div>

        <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight">
          <span className="gradient-text">Complement</span>
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-xl md:text-2xl text-text-dim font-light leading-relaxed mb-4"
        >
          Know who completes you.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-base text-text-faint leading-relaxed mb-12 max-w-lg mx-auto"
        >
          Three questions. Two people. One analysis that sees what you can&apos;t.
          Not who you want — who you actually need.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(201, 160, 220, 0.3)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onStart}
          className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-accent/20 to-rose/20 border border-accent/30 rounded-full text-lg font-medium text-text hover:border-accent/50 transition-all duration-300 cursor-pointer"
        >
          Begin Analysis
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onQuickTest}
          className="group inline-flex items-center gap-2 ml-3 px-6 py-4 bg-surface/40 border border-surface-light/50 rounded-full text-base text-text-dim hover:text-text hover:border-surface-light transition-all duration-300 cursor-pointer"
        >
          <Zap className="w-4 h-4 text-warm" />
          Quick Test
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="mt-3 text-xs text-text-faint/50"
        >
          Quick Test uses pre-filled sample answers to test different models
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-16 text-sm text-text-faint/60 italic font-serif"
        >
          &ldquo;Rare people have rare matches. The tragedy isn&apos;t that their match doesn&apos;t exist
          — it&apos;s that they pass each other without recognition.&rdquo;
        </motion.p>
      </motion.div>
    </div>
  );
}
