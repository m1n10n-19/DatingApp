import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Shield } from 'lucide-react';
import { TRUTH_PREAMBLE } from '../services/questions';
import { getActionButtonClasses } from '../utils/styles';

export default function TruthPreamble({ onAccept, onCancel }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rose/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-2xl w-full relative z-10"
      >
        <div className="bg-surface/40 border border-surface-light/50 rounded-2xl p-8 md:p-12 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-text">
              Before we begin
            </h2>
          </div>

          <p className="text-text-dim leading-relaxed text-base md:text-lg mb-10">
            {TRUTH_PREAMBLE}
          </p>

          <div className="flex items-center gap-4">
            {onCancel && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="inline-flex items-center gap-2 px-6 py-4 bg-surface/40 border border-surface-light/50 rounded-full text-base text-text-dim hover:text-text hover:border-surface-light transition-all duration-300 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(201, 160, 220, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              onClick={onAccept}
              className={getActionButtonClasses(true)}
            >
              I understand, continue
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
