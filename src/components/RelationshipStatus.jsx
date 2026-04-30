import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Heart, Sparkles } from 'lucide-react';
import ProfilePreviewCard from './ProfilePreviewCard';
import { getActionButtonClasses } from '../utils/styles';

export default function RelationshipStatus({ personA, personB, onConfirm, onBack }) {
  const [status, setStatus] = useState('new_match');

  const options = [
    {
      value: 'new_match',
      label: 'Considering / new match',
      description: 'Just met, dating, or exploring compatibility',
      icon: Sparkles,
    },
    {
      value: 'existing_couple',
      label: 'Already in a relationship',
      description: 'Together and looking to deepen understanding',
      icon: Heart,
    },
  ];

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
        {/* Paired profiles preview */}
        {personA && personB && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            <ProfilePreviewCard profile={personA} />
            <ProfilePreviewCard profile={personB} />
          </div>
        )}

        <div className="bg-surface/40 border border-surface-light/50 rounded-2xl p-8 backdrop-blur-sm">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-text mb-2">
            What&apos;s the relationship?
          </h2>
          <p className="text-text-dim mb-8">
            This shapes how we frame the analysis.
          </p>

          <div className="space-y-3 mb-8">
            {options.map((option) => {
              const Icon = option.icon;
              const isSelected = status === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setStatus(option.value)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 text-left cursor-pointer ${
                    isSelected
                      ? 'border-accent/50 bg-accent/5 ring-1 ring-accent/20'
                      : 'border-surface-light/50 bg-surface/20 hover:border-surface-light'
                  }`}
                >
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-accent/20' : 'bg-surface'
                  }`}>
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-accent' : 'text-text-dim'}`} />
                  </div>
                  <div>
                    <p className={`font-medium ${isSelected ? 'text-text' : 'text-text-dim'}`}>
                      {option.label}
                    </p>
                    <p className="text-sm text-text-faint mt-0.5">{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            {onBack && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onBack}
                className="inline-flex items-center gap-2 px-6 py-4 bg-surface/40 border border-surface-light/50 rounded-full text-base text-text-dim hover:text-text hover:border-surface-light transition-all duration-300 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(201, 160, 220, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onConfirm(status)}
              className={getActionButtonClasses(true)}
            >
              Continue to analysis
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
