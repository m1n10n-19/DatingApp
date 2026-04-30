import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw, AlertTriangle, Cpu, Loader2, Sparkles,
  Clock, Wrench, Shield, Eye, MessageCircle, Target,
  Activity, Timer, Lightbulb, XCircle, User,
} from 'lucide-react';
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
  individualRepairLoading = null,
  individualRepairError = null,
  onRequestRepair,
  onRequestSimulate,
  onRequestIndividualRepair,
}) {
  const [activeTab, setActiveTab] = useState('profiles');
  const [individualRepairResults, setIndividualRepairResults] = useState({});

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
            {[
              { person: personA, profile: results.personA, color: 'accent', key: 'A' },
              { person: personB, profile: results.personB, color: 'rose', key: 'B' },
            ].map(({ person, profile, color, key }) => (
              <div key={key}>
                <h3 className={`text-center text-lg font-semibold text-${color} mb-6`}>{person.name}</h3>
                <ProfileCard profile={profile} color={color} />
                {onRequestIndividualRepair && (
                  <IndividualRepairSection
                    person={person}
                    personKey={key}
                    loading={individualRepairLoading === key}
                    error={individualRepairError?.key === key ? individualRepairError.message : null}
                    result={individualRepairResults[key]}
                    onRequest={() => {
                      onRequestIndividualRepair(person, key, (repairData) => {
                        setIndividualRepairResults((prev) => ({ ...prev, [key]: repairData }));
                      });
                    }}
                    color={color}
                  />
                )}
              </div>
            ))}
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

/* ---------- Break type badge colors ---------- */
const breakTypeBadgeColors = {
  ATTACHMENT: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  COMMUNICATION: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  SHADOW: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  TRUST: 'bg-red-500/10 text-red-400 border-red-500/20',
  VALUES: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  DESIRE: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
};

function RepairTab({ repair, loading, error, onRequest }) {
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
    const badgeColor = breakTypeBadgeColors[repair.breakType] || 'bg-accent/10 text-accent border-accent/20';

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Real Break — header with break type badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="mb-6 p-6 rounded-2xl bg-surface/40 border border-surface-light/30 hover:border-surface-light/60 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-medium text-text-dim uppercase tracking-wide">
              The Real Break
            </h3>
            {repair.breakType && (
              <span className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full border ${badgeColor}`}>
                {repair.breakType}
              </span>
            )}
          </div>
          <p className="text-text leading-relaxed">{repair.realBreak}</p>
        </motion.div>

        {/* Primary Method + Why */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-6 p-6 rounded-2xl bg-surface/40 border border-surface-light/30 hover:border-surface-light/60 transition-all duration-300"
        >
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-medium text-text-dim uppercase tracking-wide">
              Primary Method
            </h3>
          </div>
          <p className="text-text leading-relaxed font-medium mb-4">{repair.primaryMethod}</p>
          {repair.whyThisMethod && (
            <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-accent" />
                <h4 className="text-xs font-medium text-text-dim uppercase tracking-wide">Why This Method</h4>
              </div>
              <p className="text-text leading-relaxed text-sm">{repair.whyThisMethod}</p>
            </div>
          )}
        </motion.div>

        {/* Practice Instructions */}
        {repair.practiceInstructions && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mb-6 p-6 rounded-2xl bg-surface/40 border border-surface-light/30 hover:border-surface-light/60 transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium text-text-dim uppercase tracking-wide">
                Practice Instructions
              </h3>
            </div>
            <p className="text-text leading-relaxed">{repair.practiceInstructions}</p>
          </motion.div>
        )}

        {/* Measurable Indicators + Timeframe */}
        {(repair.measurableIndicators || repair.timeframe) && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="mb-6 grid md:grid-cols-2 gap-4"
          >
            {repair.measurableIndicators && (
              <div className="p-6 rounded-2xl bg-surface/40 border border-surface-light/30 hover:border-surface-light/60 transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-medium text-text-dim uppercase tracking-wide">
                    Measurable Indicators
                  </h3>
                </div>
                <p className="text-text leading-relaxed text-sm">{repair.measurableIndicators}</p>
              </div>
            )}
            {repair.timeframe && (
              <div className="p-6 rounded-2xl bg-surface/40 border border-surface-light/30 hover:border-surface-light/60 transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <Timer className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-medium text-text-dim uppercase tracking-wide">
                    Timeframe
                  </h3>
                </div>
                <p className="text-text leading-relaxed text-sm">{repair.timeframe}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Secondary Method + Practice */}
        {(repair.secondaryMethod || repair.secondaryPractice) && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="mb-6 p-6 rounded-2xl bg-surface/40 border border-surface-light/30 hover:border-surface-light/60 transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium text-text-dim uppercase tracking-wide">
                Secondary Method
              </h3>
            </div>
            <p className="text-text leading-relaxed font-medium mb-3">{repair.secondaryMethod}</p>
            {repair.secondaryPractice && (
              <p className="text-text leading-relaxed text-sm text-text-dim">{repair.secondaryPractice}</p>
            )}
          </motion.div>
        )}

        {/* Warning Sign */}
        {repair.warningSign && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.40 }}
            className="mb-6 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-medium text-text-dim uppercase tracking-wide">
                Warning Sign
              </h3>
            </div>
            <p className="text-text leading-relaxed">{repair.warningSign}</p>
          </motion.div>
        )}

        {/* Repair Is Impossible If */}
        {repair.repairIsImpossibleIf && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48 }}
            className="mb-6 p-6 rounded-2xl bg-rose/5 border border-rose/20 hover:border-rose/40 transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-4 h-4 text-rose" />
              <h3 className="text-sm font-medium text-text-dim uppercase tracking-wide">
                Repair Is Impossible If
              </h3>
            </div>
            <p className="text-text leading-relaxed">{repair.repairIsImpossibleIf}</p>
          </motion.div>
        )}

        {/* Closing Line */}
        {repair.closingLine && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.56 }}
            className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-accent/5 to-rose/5 border border-accent/20 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium text-text-dim uppercase tracking-wide">
                In One Line
              </h3>
            </div>
            <p className="text-text leading-relaxed italic font-medium">{repair.closingLine}</p>
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
        Generate personalized repair strategies based on the compatibility analysis. Includes targeted methods, practice instructions, and measurable indicators.
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

function IndividualRepairSection({ person, loading, error, result, onRequest, color }) {
  const colorText = color === 'rose' ? 'text-rose' : 'text-accent';
  const colorBorder = color === 'rose' ? 'border-rose/30' : 'border-accent/30';
  const colorBg = color === 'rose' ? 'from-rose/10 to-rose/20' : 'from-accent/10 to-accent/20';

  return (
    <div className="mt-6">
      {!result && !loading && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <button
            onClick={onRequest}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r ${colorBg} border ${colorBorder} text-text hover:border-opacity-70 transition-all cursor-pointer text-sm font-medium`}
          >
            <User className="w-4 h-4" />
            Individual Repair for {person.name}
          </button>
        </motion.div>
      )}

      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-6"
        >
          <Loader2 className={`w-6 h-6 ${colorText} animate-spin mx-auto mb-2`} />
          <p className="text-text-dim text-sm">Generating individual repair for {person.name}...</p>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-4"
        >
          <p className="text-rose text-sm mb-2">Failed to generate individual repair.</p>
          <p className="text-text-faint text-xs mb-3">{error}</p>
          <button
            onClick={onRequest}
            className="inline-flex items-center gap-1 px-4 py-2 bg-surface border border-surface-light rounded-full text-text text-sm hover:border-accent/30 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Retry
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-5 rounded-2xl bg-surface/40 border border-surface-light/30"
          >
            <div className="flex items-center gap-2 mb-4">
              <Wrench className={`w-4 h-4 ${colorText}`} />
              <h4 className="text-sm font-medium text-text-dim uppercase tracking-wide">
                Individual Repair — {person.name}
              </h4>
            </div>

            {result.realBreak && (
              <div className="mb-3">
                <span className="text-xs font-semibold text-text-dim uppercase tracking-wide">The Real Break: </span>
                <span className="text-text leading-relaxed text-sm">{result.realBreak}</span>
              </div>
            )}

            {result.primaryMethod && (
              <div className="mb-3">
                <span className="text-xs font-semibold text-text-dim uppercase tracking-wide">Primary Method: </span>
                <span className="text-text leading-relaxed text-sm">{result.primaryMethod}</span>
              </div>
            )}

            {result.practiceInstructions && (
              <div className="mb-3">
                <span className="text-xs font-semibold text-text-dim uppercase tracking-wide">Practice: </span>
                <span className="text-text leading-relaxed text-sm">{result.practiceInstructions}</span>
              </div>
            )}

            {result.closingLine && (
              <div className="mt-4 pt-3 border-t border-surface-light/30 text-center">
                <p className="text-text text-sm italic">{result.closingLine}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
        {/* Years 1, 3, 5, 7 — dual path: Examined vs Unexamined */}
        {yearSections.map((section, index) => {
          const yearData = simulation[section.key];
          // Support both old (string) and new (object with examined/unexamined) formats
          const isStructured = yearData && typeof yearData === 'object';

          return (
            <motion.div
              key={section.key}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="mb-6 p-6 rounded-2xl bg-surface/40 border border-surface-light/30 hover:border-surface-light/60 transition-all duration-300"
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-medium text-text-dim uppercase tracking-wide">
                  {section.label}
                </h3>
              </div>
              {isStructured ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-sage/5 border border-sage/20">
                    <h4 className="text-sm font-semibold text-sage mb-2">Examined</h4>
                    <p className="text-text leading-relaxed text-sm">{yearData.examined}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <h4 className="text-sm font-semibold text-amber-400 mb-2">Unexamined</h4>
                    <p className="text-text leading-relaxed text-sm">{yearData.unexamined}</p>
                  </div>
                </div>
              ) : (
                <p className="text-text leading-relaxed">{yearData}</p>
              )}
            </motion.div>
          );
        })}

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

        {/* One Intervention — structured with when/what/why */}
        {simulation.oneIntervention && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-accent/5 to-rose/5 border border-accent/20 hover:border-accent/40 transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium text-text-dim uppercase tracking-wide">
                If You Only Do One Thing
              </h3>
            </div>
            {typeof simulation.oneIntervention === 'object' ? (
              <div className="space-y-3">
                {simulation.oneIntervention.when && (
                  <div>
                    <span className="text-xs font-semibold text-accent uppercase tracking-wide">When: </span>
                    <span className="text-text leading-relaxed text-sm">{simulation.oneIntervention.when}</span>
                  </div>
                )}
                {simulation.oneIntervention.what && (
                  <div>
                    <span className="text-xs font-semibold text-accent uppercase tracking-wide">What: </span>
                    <span className="text-text leading-relaxed text-sm font-medium">{simulation.oneIntervention.what}</span>
                  </div>
                )}
                {simulation.oneIntervention.why && (
                  <div>
                    <span className="text-xs font-semibold text-accent uppercase tracking-wide">Why: </span>
                    <span className="text-text leading-relaxed text-sm">{simulation.oneIntervention.why}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-text leading-relaxed font-medium">{simulation.oneIntervention}</p>
            )}
          </motion.div>
        )}

        {/* Closing Line */}
        {simulation.closingLine && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-accent/5 to-rose/5 border border-accent/20 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium text-text-dim uppercase tracking-wide">
                In One Line
              </h3>
            </div>
            <p className="text-text leading-relaxed italic font-medium">{simulation.closingLine}</p>
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
