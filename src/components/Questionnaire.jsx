import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, User, ChevronDown } from 'lucide-react';
import {
  CORE_QUESTIONS,
  KOKOLOGY_QUESTIONS,
  SHADOW_QUESTIONS,
  DESIRE_QUESTIONS,
  CONTRADICTION_PAIRS,
  MODULE_DEFS,
} from '../services/questions';
import { getActionButtonClasses } from '../utils/styles';

const PHASES = [
  'name_gender',
  'core',
  'module_select',
  'contradictions_first',
  'kokology',
  'shadow',
  'desire',
  'contradictions_second',
  'done',
];

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

export default function Questionnaire({ personLabel, initialPerson, onComplete, onCancel }) {
  const [phase, setPhase] = useState('name_gender');
  const [name, setName] = useState(initialPerson?.name || '');
  const [gender, setGender] = useState(initialPerson?.gender || '');
  const [genderOpen, setGenderOpen] = useState(false);

  // Module answers
  const [coreAnswers, setCoreAnswers] = useState(
    () => initialPerson?.moduleAnswers?.core?.slice() || ['', '', '']
  );
  const [kokologyAnswers, setKokologyAnswers] = useState(
    () => initialPerson?.moduleAnswers?.kokology?.slice() || ['', '', '', '']
  );
  const [shadowAnswers, setShadowAnswers] = useState(
    () => initialPerson?.moduleAnswers?.shadow?.slice() || ['', '', '']
  );
  const [desireAnswers, setDesireAnswers] = useState(
    () => initialPerson?.moduleAnswers?.desire?.slice() || ['', '']
  );
  // Contradictions: 6 answers total (3 first-half, 3 second-half)
  const [contradictionAnswers, setContradictionAnswers] = useState(
    () => initialPerson?.moduleAnswers?.contradictions?.slice() || ['', '', '', '', '', '']
  );

  // Enabled optional modules
  const [enabledModules, setEnabledModules] = useState(
    () => initialPerson?.enabledModules?.slice() || []
  );

  // Current question index within a phase
  const [questionIdx, setQuestionIdx] = useState(0);

  const nextButtonRef = useRef(null);

  // Questions for the current phase
  const currentQuestions = useMemo(() => {
    switch (phase) {
      case 'core':
        return CORE_QUESTIONS;
      case 'kokology':
        return KOKOLOGY_QUESTIONS;
      case 'shadow':
        return SHADOW_QUESTIONS;
      case 'desire':
        return DESIRE_QUESTIONS;
      case 'contradictions_first':
        return CONTRADICTION_PAIRS.map((p) => p.first);
      case 'contradictions_second':
        return CONTRADICTION_PAIRS.map((p) => p.second);
      default:
        return [];
    }
  }, [phase]);

  const currentAnswers = useMemo(() => {
    switch (phase) {
      case 'core':
        return coreAnswers;
      case 'kokology':
        return kokologyAnswers;
      case 'shadow':
        return shadowAnswers;
      case 'desire':
        return desireAnswers;
      case 'contradictions_first':
        return contradictionAnswers.slice(0, 3);
      case 'contradictions_second':
        return contradictionAnswers.slice(3, 6);
      default:
        return [];
    }
  }, [phase, coreAnswers, kokologyAnswers, shadowAnswers, desireAnswers, contradictionAnswers]);

  const setCurrentAnswer = (idx, value) => {
    switch (phase) {
      case 'core': {
        const next = [...coreAnswers];
        next[idx] = value;
        setCoreAnswers(next);
        break;
      }
      case 'kokology': {
        const next = [...kokologyAnswers];
        next[idx] = value;
        setKokologyAnswers(next);
        break;
      }
      case 'shadow': {
        const next = [...shadowAnswers];
        next[idx] = value;
        setShadowAnswers(next);
        break;
      }
      case 'desire': {
        const next = [...desireAnswers];
        next[idx] = value;
        setDesireAnswers(next);
        break;
      }
      case 'contradictions_first': {
        const next = [...contradictionAnswers];
        next[idx] = value;
        setContradictionAnswers(next);
        break;
      }
      case 'contradictions_second': {
        const next = [...contradictionAnswers];
        next[idx + 3] = value;
        setContradictionAnswers(next);
        break;
      }
    }
  };

  // Determine the next phase, skipping disabled modules
  const getNextPhase = (currentPhase) => {
    const idx = PHASES.indexOf(currentPhase);
    for (let i = idx + 1; i < PHASES.length; i++) {
      const p = PHASES[i];
      // Skip disabled optional module phases
      if (p === 'contradictions_first' && !enabledModules.includes('contradictions')) continue;
      if (p === 'contradictions_second' && !enabledModules.includes('contradictions')) continue;
      if (p === 'kokology' && !enabledModules.includes('kokology')) continue;
      if (p === 'shadow' && !enabledModules.includes('shadow')) continue;
      if (p === 'desire' && !enabledModules.includes('desire')) continue;
      return p;
    }
    return 'done';
  };

  const advancePhase = () => {
    const next = getNextPhase(phase);
    setPhase(next);
    setQuestionIdx(0);
    if (next === 'done') {
      const profile = buildProfile();
      onComplete(profile);
    }
  };

  const buildProfile = () => {
    const moduleAnswers = { core: coreAnswers };
    if (enabledModules.includes('kokology')) moduleAnswers.kokology = kokologyAnswers;
    if (enabledModules.includes('shadow')) moduleAnswers.shadow = shadowAnswers;
    if (enabledModules.includes('desire')) moduleAnswers.desire = desireAnswers;
    if (enabledModules.includes('contradictions')) moduleAnswers.contradictions = contradictionAnswers;

    return {
      id: initialPerson?.id || crypto.randomUUID(),
      name: name.trim(),
      gender,
      enabledModules: [...enabledModules],
      moduleAnswers,
      schemaVersion: 1,
      createdAt: initialPerson?.createdAt || new Date().toISOString(),
    };
  };

  // Validation
  const canProceedFromIntro = name.trim().length > 0 && gender.length > 0;
  const canProceedFromQuestion =
    currentQuestions.length > 0 &&
    questionIdx < currentQuestions.length &&
    currentAnswers[questionIdx]?.trim().length > 20;

  // Scroll the Next button into view when the answer becomes valid
  useEffect(() => {
    if (canProceedFromQuestion && nextButtonRef.current?.scrollIntoView) {
      nextButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [canProceedFromQuestion]);

  const handleNextQuestion = () => {
    if (questionIdx < currentQuestions.length - 1) {
      setQuestionIdx(questionIdx + 1);
    } else {
      advancePhase();
    }
  };

  // Module toggle
  const toggleModule = (key) => {
    setEnabledModules((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Progress calculation
  const totalPhases = PHASES.filter(
    (p) =>
      p === 'name_gender' ||
      p === 'core' ||
      p === 'module_select' ||
      p === 'done' ||
      (p === 'contradictions_first' && enabledModules.includes('contradictions')) ||
      (p === 'contradictions_second' && enabledModules.includes('contradictions')) ||
      (p === 'kokology' && enabledModules.includes('kokology')) ||
      (p === 'shadow' && enabledModules.includes('shadow')) ||
      (p === 'desire' && enabledModules.includes('desire'))
  ).length;
  const currentPhaseIdx = PHASES.filter(
    (p, i) =>
      i <= PHASES.indexOf(phase) &&
      (p === 'name_gender' ||
        p === 'core' ||
        p === 'module_select' ||
        p === 'done' ||
        (p === 'contradictions_first' && enabledModules.includes('contradictions')) ||
        (p === 'contradictions_second' && enabledModules.includes('contradictions')) ||
        (p === 'kokology' && enabledModules.includes('kokology')) ||
        (p === 'shadow' && enabledModules.includes('shadow')) ||
        (p === 'desire' && enabledModules.includes('desire')))
  ).length;
  const progress = Math.min(100, (currentPhaseIdx / totalPhases) * 100);

  const phaseLabel = () => {
    switch (phase) {
      case 'core':
        return 'Core';
      case 'kokology':
        return 'Kokology';
      case 'shadow':
        return 'Shadow';
      case 'desire':
        return 'Desire';
      case 'contradictions_first':
        return 'Contradictions (part 1)';
      case 'contradictions_second':
        return 'Contradictions (part 2)';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-8 pb-16">
      {/* Header */}
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-text-dim hover:text-text transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Cancel</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-surface border border-surface-light flex items-center justify-center">
              <User className="w-4 h-4 text-accent" />
            </div>
            <span className="text-sm text-text-dim">{personLabel || 'Profile'}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-surface rounded-full overflow-hidden mb-8">
          <motion.div
            className="h-full bg-gradient-to-r from-accent to-rose rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto w-full pt-4">
        <AnimatePresence mode="wait">
          {/* NAME + GENDER PHASE */}
          {phase === 'name_gender' && (
            <motion.div
              key="name_gender"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-sm text-accent mb-2 font-medium tracking-wide uppercase">
                {personLabel || 'Profile'}
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-text">
                Let&apos;s start with the basics.
              </h2>
              <p className="text-text-dim mb-10">
                We need a name and how you identify — this shapes how we read your answers.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-text-dim mb-2">First name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="What should we call you?"
                    className="w-full bg-surface/60 border border-surface-light rounded-xl px-5 py-4 text-text placeholder:text-text-faint focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm text-text-dim mb-2">Gender</label>
                  <button
                    onClick={() => setGenderOpen(!genderOpen)}
                    className="w-full bg-surface/60 border border-surface-light rounded-xl px-5 py-4 text-left flex items-center justify-between focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all cursor-pointer"
                  >
                    <span className={gender ? 'text-text' : 'text-text-faint'}>
                      {gender ? genderOptions.find((g) => g.value === gender)?.label : 'Select gender'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-text-dim transition-transform ${genderOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <AnimatePresence>
                    {genderOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute bottom-full left-0 right-0 mb-2 bg-surface border border-surface-light rounded-xl overflow-hidden z-20 shadow-xl"
                      >
                        {genderOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setGender(option.value);
                              setGenderOpen(false);
                            }}
                            className={`w-full px-5 py-3 text-left hover:bg-surface-light transition-colors cursor-pointer ${
                              gender === option.value
                                ? 'text-accent bg-surface-light/50'
                                : 'text-text'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: canProceedFromIntro ? 1.02 : 1 }}
                whileTap={{ scale: canProceedFromIntro ? 0.98 : 1 }}
                onClick={() => canProceedFromIntro && setPhase('core')}
                disabled={!canProceedFromIntro}
                className={`mt-10 ${getActionButtonClasses(canProceedFromIntro)}`}
              >
                Continue to questions
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}

          {/* MODULE SELECT PHASE */}
          {phase === 'module_select' && (
            <motion.div
              key="module_select"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2 text-text">
                Add depth modules?
              </h2>
              <p className="text-text-dim mb-8">
                These optional modules reveal deeper patterns. You can skip them for now.
              </p>

              <div className="space-y-3 mb-8">
                {MODULE_DEFS.filter((m) => !m.required).map((mod) => {
                  const checked = enabledModules.includes(mod.key);
                  return (
                    <label
                      key={mod.key}
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        checked
                          ? 'border-accent/40 bg-accent/5'
                          : 'border-surface-light/50 bg-surface/20 hover:border-surface-light'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleModule(mod.key)}
                        className="w-4 h-4 accent-[#c9a0dc]"
                      />
                      <div>
                        <p className="font-medium text-text">{mod.label}</p>
                        <p className="text-xs text-text-faint">{mod.count} questions</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(201, 160, 220, 0.3)' }}
                whileTap={{ scale: 0.98 }}
                onClick={advancePhase}
                className={getActionButtonClasses(true)}
              >
                {enabledModules.length > 0 ? 'Continue' : 'Skip depth modules'}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}

          {/* QUESTION PHASES */}
          {['core', 'kokology', 'shadow', 'desire', 'contradictions_first', 'contradictions_second'].includes(phase) && (
            <motion.div
              key={`${phase}-${questionIdx}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-sm text-accent mb-2 font-medium tracking-wide uppercase">
                {phaseLabel()} — Question {questionIdx + 1} of {currentQuestions.length}
              </p>
              <h2 className="font-serif text-xl md:text-2xl font-semibold mb-4 text-text leading-snug">
                {currentQuestions[questionIdx]?.text}
              </h2>

              <textarea
                value={currentAnswers[questionIdx] || ''}
                onChange={(e) => setCurrentAnswer(questionIdx, e.target.value)}
                placeholder={currentQuestions[questionIdx]?.placeholder}
                rows={3}
                className="w-full bg-surface/60 border border-surface-light rounded-xl px-5 py-4 text-text placeholder:text-text-faint focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-text-faint">
                  {(currentAnswers[questionIdx]?.trim().length || 0) < 20
                    ? `${20 - (currentAnswers[questionIdx]?.trim().length || 0)} more characters needed`
                    : 'Ready to continue'}
                </p>
              </div>

              <div ref={nextButtonRef}>
                <motion.button
                  whileHover={{ scale: canProceedFromQuestion ? 1.02 : 1 }}
                  whileTap={{ scale: canProceedFromQuestion ? 0.98 : 1 }}
                  onClick={() => canProceedFromQuestion && handleNextQuestion()}
                  disabled={!canProceedFromQuestion}
                  className={`mt-8 ${getActionButtonClasses(canProceedFromQuestion)}`}
                >
                  {questionIdx === currentQuestions.length - 1 && getNextPhase(phase) === 'done'
                    ? 'Complete'
                    : 'Next question'}
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
