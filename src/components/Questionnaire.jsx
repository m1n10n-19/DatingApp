import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, User, ChevronDown } from 'lucide-react';
import { getQuestions } from '../services/questions';
import { getActionButtonClasses } from '../utils/styles';

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
  const [hasHistory, setHasHistory] = useState(
    initialPerson?.hasRelationshipHistory ?? true
  );

  // Flat answers array — sized generously; trimmed on submit
  const [answers, setAnswers] = useState(
    () => initialPerson?.answers?.slice() || ['', '', '', '', '', '', '', '', '']
  );

  // Current question index within the questions phase
  const [questionIdx, setQuestionIdx] = useState(0);

  const nextButtonRef = useRef(null);

  // Get the questions list based on gender and relationship history
  const questions = useMemo(() => getQuestions(gender, hasHistory), [gender, hasHistory]);

  const setAnswer = (idx, value) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const advancePhase = () => {
    if (phase === 'name_gender') {
      setPhase('questions');
      setQuestionIdx(0);
    } else if (phase === 'questions') {
      setPhase('done');
      const profile = buildProfile();
      onComplete(profile);
    }
  };

  const buildProfile = () => {
    // Trim answers to the actual question count
    const trimmedAnswers = answers.slice(0, questions.length);
    return {
      id: initialPerson?.id || crypto.randomUUID(),
      name: name.trim(),
      gender,
      answers: trimmedAnswers,
      hasRelationshipHistory: hasHistory,
      schemaVersion: 2,
      createdAt: initialPerson?.createdAt || new Date().toISOString(),
    };
  };

  // Validation
  const canProceedFromIntro = name.trim().length > 0 && gender.length > 0;
  const canProceedFromQuestion =
    phase === 'questions' &&
    questionIdx < questions.length &&
    answers[questionIdx]?.trim().length > 20;

  // Scroll the Next button into view when the answer becomes valid
  useEffect(() => {
    if (canProceedFromQuestion && nextButtonRef.current?.scrollIntoView) {
      nextButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [canProceedFromQuestion]);

  const handleNextQuestion = () => {
    if (questionIdx < questions.length - 1) {
      setQuestionIdx(questionIdx + 1);
    } else {
      advancePhase();
    }
  };

  // Progress calculation
  // Total steps = 1 (name_gender) + questions.length
  const totalSteps = 1 + questions.length;
  const currentStep = phase === 'name_gender' ? 1 : 1 + questionIdx + 1;
  const progress = Math.min(100, (currentStep / totalSteps) * 100);

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

                {/* Relationship history toggle */}
                <div>
                  <label className="block text-sm text-text-dim mb-3">
                    Have you been in a serious relationship before?
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setHasHistory(true)}
                      className={`flex-1 px-5 py-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                        hasHistory
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-surface-light bg-surface/60 text-text-dim hover:bg-surface-light'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasHistory(false)}
                      className={`flex-1 px-5 py-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                        !hasHistory
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-surface-light bg-surface/60 text-text-dim hover:bg-surface-light'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: canProceedFromIntro ? 1.02 : 1 }}
                whileTap={{ scale: canProceedFromIntro ? 0.98 : 1 }}
                onClick={() => canProceedFromIntro && advancePhase()}
                disabled={!canProceedFromIntro}
                className={`mt-10 ${getActionButtonClasses(canProceedFromIntro)}`}
              >
                Continue to questions
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}

          {/* QUESTIONS PHASE */}
          {phase === 'questions' && (
            <motion.div
              key={`question-${questionIdx}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-sm text-accent mb-2 font-medium tracking-wide uppercase">
                {questions[questionIdx]?.label} — Question {questionIdx + 1} of {questions.length}
              </p>
              <h2 className="font-serif text-xl md:text-2xl font-semibold mb-4 text-text leading-snug">
                {questions[questionIdx]?.text}
              </h2>

              <textarea
                value={answers[questionIdx] || ''}
                onChange={(e) => setAnswer(questionIdx, e.target.value)}
                placeholder={questions[questionIdx]?.placeholder}
                rows={3}
                className="w-full bg-surface/60 border border-surface-light rounded-xl px-5 py-4 text-text placeholder:text-text-faint focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-text-faint">
                  {(answers[questionIdx]?.trim().length || 0) < 20
                    ? `${20 - (answers[questionIdx]?.trim().length || 0)} more characters needed`
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
                  {questionIdx === questions.length - 1 ? 'Complete' : 'Next question'}
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
