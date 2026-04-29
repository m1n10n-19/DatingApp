import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import ProfileCard from './ProfileCard';
import CompatibilitySection from './CompatibilitySection';

export default function Results({ results, error, personA, personB, onReset }) {
  const [activeTab, setActiveTab] = useState('compatibility');

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-rose/10 border border-rose/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-rose" />
          </div>
          <h2 className="font-serif text-2xl font-bold mb-3 text-text">Analysis Failed</h2>
          <p className="text-text-dim mb-2">Something went wrong during the analysis.</p>
          <p className="text-sm text-text-faint mb-8 break-words">{error}</p>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-surface border border-surface-light rounded-full text-text hover:border-accent/30 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!results) return null;

  const tabs = [
    { id: 'compatibility', label: 'Compatibility' },
    { id: 'personA', label: personA.name },
    { id: 'personB', label: personB.name },
  ];

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <p className="text-sm text-accent mb-2 font-medium tracking-wide uppercase">Analysis Complete</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            <span className="text-accent">{personA.name}</span>
            <span className="text-text-faint mx-3">&amp;</span>
            <span className="text-rose">{personB.name}</span>
          </h1>
        </motion.div>

        {/* Tab navigation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-2 mb-12"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-accent/20 to-rose/20 border border-accent/30 text-text'
                  : 'bg-surface/40 border border-surface-light/50 text-text-dim hover:text-text hover:border-surface-light'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        {activeTab === 'compatibility' && (
          <CompatibilitySection
            data={results.compatibility}
            personA={personA}
            personB={personB}
          />
        )}
        {activeTab === 'personA' && (
          <ProfileCard
            data={results.personA}
            name={personA.name}
            color="accent"
          />
        )}
        {activeTab === 'personB' && (
          <ProfileCard
            data={results.personB}
            name={personB.name}
            color="rose"
          />
        )}

        {/* Reset button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-16 pb-8"
        >
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-surface/40 border border-surface-light/50 rounded-full text-sm text-text-dim hover:text-text hover:border-surface-light transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Start New Analysis
          </button>
        </motion.div>
      </div>
    </div>
  );
}
