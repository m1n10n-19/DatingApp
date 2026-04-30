import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, AlertTriangle, Cpu, Loader2, Heart, Sparkles, Clock, Wrench } from 'lucide-react';
import ProfileCard from './ProfileCard';
import CompatibilitySection from './CompatibilitySection';
import { getTabButtonClasses } from '../utils/styles';

function TabErrorState({ message, detail, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-14 h-14 rounded-full bg-rose/10 border border-rose/20 flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="w-7 h-7 text-rose" />
      </div>
      <p className="text-text-dim mb-2">{message}</p>
      <p className="text-sm text-text-faint mb-6 break-words">{detail}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-3 bg-surface border border-surface-light rounded-full text-text hover:border-accent/30 transition-all cursor-pointer"
      >
        <RotateCcw className="w-4 h-4" />
        Try Again
      </button>
    </motion.div>
  );
}

function TabLoadingState({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-16"
    >
      <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
      <p className="text-text-dim">{message}</p>
    </motion.div>
  );
}

export default function Results({
  results,
  error,
  personA,
  personB,
  onReset,
  repairLoading = false,
  repairError = null,
  simulateLoading = false,
  simulateError = null,
  onRequestRepair,
  onRequestSimulate,
}) {
  const [activeTab, setActiveTab] = useState('profiles');

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
    { id: 'profiles', label: 'Profiles' },
    { id: 'compatibility', label: 'Compatibility' },
    { id: 'repair', label: 'Repair' },
    { id: 'simulate', label: 'Simulate' },
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
          {results.meta && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/40 border border-surface-light/30 mb-4">
              <Cpu className="w-3 h-3 text-text-faint" />
              <span className="text-xs text-text-faint">
                {results.meta.provider} / {results.meta.model}
              </span>
            </div>
          )}
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
          className="flex justify-center gap-2 mb-12 flex-wrap"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={getTabButtonClasses(activeTab === tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        {activeTab === 'profiles' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-center text-lg font-semibold text-accent mb-6">{personA.name}</h3>
              <ProfileCard profile={results.personA} color="accent" />
            </div>
            <div>
              <h3 className="text-center text-lg font-semibold text-rose mb-6">{personB.name}</h3>
              <ProfileCard profile={results.personB} color="rose" />
            </div>
          </div>
        )}

        {activeTab === 'compatibility' && (
          <CompatibilitySection compatibility={results.compatibility} />
        )}

        {activeTab === 'repair' && (
          <RepairTab
            repair={results.repair}
            loading={repairLoading}
            error={repairError}
            onRequest={onRequestRepair}
            personAName={personA.name}
            personBName={personB.name}
          />
        )}

        {activeTab === 'simulate' && (
          <SimulateTab
            simulation={results.simulation}
            loading={simulateLoading}
            error={simulateError}
            onRequest={onRequestSimulate}
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

function RepairTab({ repair, loading, error, onRequest, personAName, personBName }) {
  if (error) {
    return (
      <TabErrorState
        message="Failed to generate repair guidance."
        detail={error}
        onRetry={onRequest}
      />
    );
  }

  if (loading) {
    return <TabLoadingState message="Generating repair guidance..." />;
  }

  if (repair) {
    const sections = [
      { key: 'realBreak', label: 'The Real Break', icon: AlertTriangle },
      { key: 'dailyPractice', label: 'Daily Practice', icon: Heart },
      { key: 'cognitiveRepair', label: 'Cognitive Repair', icon: Sparkles },
      { key: 'revisionPractice', label: 'Revision Practice', icon: Wrench },
      { key: 'equanimityPractice', label: 'Equanimity Practice', icon: Heart },
      { key: 'shadowWork', label: 'Shadow Work', icon: Sparkles },
      { key: 'communicationRepair', label: 'Communication Repair', icon: Wrench },
    ];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.key}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="mb-6 p-6 rounded-2xl bg-surface/40 border border-surface-light/30 hover:border-surface-light/60 transition-all duration-300"
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-medium text-text-dim uppercase tracking-wide">
                  {section.label}
                </h3>
              </div>
              <p className="text-text leading-relaxed">{repair[section.key]}</p>
            </motion.div>
          );
        })}

        {/* Emotional Calibration — special two-person section */}
        {repair.emotionalCalibration && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 p-6 rounded-2xl bg-surface/40 border border-surface-light/30 hover:border-surface-light/60 transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium text-text-dim uppercase tracking-wide">
                Emotional Calibration
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                <h4 className="text-sm font-semibold text-accent mb-2">{personAName}</h4>
                <p className="text-text leading-relaxed text-sm">{repair.emotionalCalibration.personA}</p>
              </div>
              <div className="p-4 rounded-xl bg-rose/5 border border-rose/20">
                <h4 className="text-sm font-semibold text-rose mb-2">{personBName}</h4>
                <p className="text-text leading-relaxed text-sm">{repair.emotionalCalibration.personB}</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Default: show generate button
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
        <Wrench className="w-7 h-7 text-accent" />
      </div>
      <h3 className="font-serif text-2xl font-bold text-text mb-3">Repair Guidance</h3>
      <p className="text-text-dim mb-8 max-w-md mx-auto">
        Generate personalized repair strategies based on the compatibility analysis. Includes emotional calibration, daily practices, and communication tools.
      </p>
      <button
        onClick={onRequest}
        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-accent/20 to-rose/20 border border-accent/30 text-text hover:border-accent/50 transition-all cursor-pointer font-medium"
      >
        <Wrench className="w-4 h-4" />
        Generate Repair Plan
      </button>
    </motion.div>
  );
}

function SimulateTab({ simulation, loading, error, onRequest }) {
  if (error) {
    return (
      <TabErrorState
        message="Failed to generate simulation."
        detail={error}
        onRetry={onRequest}
      />
    );
  }

  if (loading) {
    return <TabLoadingState message="Projecting future..." />;
  }

  if (simulation) {
    const yearSections = [
      { key: 'year1', label: 'Year 1' },
      { key: 'year3', label: 'Year 3' },
      { key: 'year5', label: 'Year 5' },
      { key: 'year7', label: 'Year 7' },
    ];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {yearSections.map((section, index) => (
          <motion.div
            key={section.key}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="mb-6 p-6 rounded-2xl bg-surface/40 border border-surface-light/30 hover:border-surface-light/60 transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium text-text-dim uppercase tracking-wide">
                {section.label}
              </h3>
            </div>
            <p className="text-text leading-relaxed">{simulation[section.key]}</p>
          </motion.div>
        ))}

        {/* Year 10 — Best/Worst Case */}
        {simulation.year10 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6 p-6 rounded-2xl bg-surface/40 border border-surface-light/30 hover:border-surface-light/60 transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium text-text-dim uppercase tracking-wide">
                Year 10
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-sage/5 border border-sage/20">
                <h4 className="text-sm font-semibold text-sage mb-2">Best Case</h4>
                <p className="text-text leading-relaxed text-sm">{simulation.year10.bestCase}</p>
              </div>
              <div className="p-4 rounded-xl bg-rose/5 border border-rose/20">
                <h4 className="text-sm font-semibold text-rose mb-2">Worst Case</h4>
                <p className="text-text leading-relaxed text-sm">{simulation.year10.worstCase}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* One Intervention */}
        {simulation.oneIntervention && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-accent/5 to-rose/5 border border-accent/20 hover:border-accent/40 transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium text-text-dim uppercase tracking-wide">
                If You Only Do One Thing
              </h3>
            </div>
            <p className="text-text leading-relaxed font-medium">{simulation.oneIntervention}</p>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Default: show generate button
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
        <Clock className="w-7 h-7 text-accent" />
      </div>
      <h3 className="font-serif text-2xl font-bold text-text mb-3">Future Projection</h3>
      <p className="text-text-dim mb-8 max-w-md mx-auto">
        Project the relationship trajectory over 10 years. See how the dynamic evolves at key milestones, including best and worst case outcomes.
      </p>
      <button
        onClick={onRequest}
        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-accent/20 to-rose/20 border border-accent/30 text-text hover:border-accent/50 transition-all cursor-pointer font-medium"
      >
        <Clock className="w-4 h-4" />
        Project Future
      </button>
    </motion.div>
  );
}
