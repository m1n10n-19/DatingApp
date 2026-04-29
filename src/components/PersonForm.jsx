import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, User, ChevronDown } from 'lucide-react';
import { getActionButtonClasses } from '../utils/styles';

export default function PersonForm({ label, personNumber, questions, onComplete, onBack }) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(-1); // -1 = name/gender step
  const [answers, setAnswers] = useState(() => questions.map(() => ''));
  const [genderOpen, setGenderOpen] = useState(false);

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non-binary', label: 'Non-binary' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
  ];

  const canProceedFromIntro = name.trim().length > 0 && gender.length > 0;
  const canProceedFromQuestion = currentQuestion >= 0 && answers[currentQuestion]?.trim().length > 20;

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      onComplete({ name: name.trim(), gender, answers });
    }
  };

  const handlePrev = () => {
    if (currentQuestion > -1) {
      setCurrentQuestion(currentQuestion - 1);
    } else {
      onBack();
    }
  };

  const progress = ((currentQuestion + 2) / (questions.length + 1)) * 100;

  return (
    <div className="min-h-screen flex flex-col px-6 pt-8 pb-16">
      {/* Header */}
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={handlePrev}
            className="flex items-center gap-2 text-text-dim hover:text-text transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-surface border border-surface-light flex items-center justify-center">
              <User className="w-4 h-4 text-accent" />
            </div>
            <span className="text-sm text-text-dim">{label}</span>
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
      <div className="flex-1 max-w-2xl mx-auto w-full pt-4">
        <div className="w-full">
          <AnimatePresence mode="wait">
            {currentQuestion === -1 ? (
              <motion.div
                key="intro"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-sm text-accent mb-2 font-medium tracking-wide uppercase">
                  Person {personNumber}
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
                      autoFocus
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-sm text-text-dim mb-2">Gender</label>
                    <button
                      onClick={() => setGenderOpen(!genderOpen)}
                      className="w-full bg-surface/60 border border-surface-light rounded-xl px-5 py-4 text-left flex items-center justify-between focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all cursor-pointer"
                    >
                      <span className={gender ? 'text-text' : 'text-text-faint'}>
                        {gender ? genderOptions.find(g => g.value === gender)?.label : 'Select gender'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-text-dim transition-transform ${genderOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {genderOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-surface border border-surface-light rounded-xl overflow-hidden z-20 shadow-xl"
                        >
                          {genderOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setGender(option.value);
                                setGenderOpen(false);
                              }}
                              className={`w-full px-5 py-3 text-left hover:bg-surface-light transition-colors cursor-pointer ${
                                gender === option.value ? 'text-accent bg-surface-light/50' : 'text-text'
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
                  onClick={() => canProceedFromIntro && setCurrentQuestion(0)}
                  disabled={!canProceedFromIntro}
                  className={`mt-10 ${getActionButtonClasses(canProceedFromIntro)}`}
                >
                  Continue to questions
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key={`q-${currentQuestion}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-sm text-accent mb-2 font-medium tracking-wide uppercase">
                  Question {currentQuestion + 1} of {questions.length}
                </p>
                <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-8 text-text leading-snug">
                  {questions[currentQuestion].text}
                </h2>

                <textarea
                  value={answers[currentQuestion]}
                  onChange={(e) => {
                    const newAnswers = [...answers];
                    newAnswers[currentQuestion] = e.target.value;
                    setAnswers(newAnswers);
                  }}
                  placeholder={questions[currentQuestion].placeholder}
                  rows={4}
                  className="w-full bg-surface/60 border border-surface-light rounded-xl px-5 py-4 text-text placeholder:text-text-faint focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all resize-none leading-relaxed"
                  autoFocus
                />

                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-text-faint">
                    {answers[currentQuestion].trim().length < 20
                      ? `${20 - answers[currentQuestion].trim().length} more characters needed`
                      : 'Ready to continue'}
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: canProceedFromQuestion ? 1.02 : 1 }}
                  whileTap={{ scale: canProceedFromQuestion ? 0.98 : 1 }}
                  onClick={() => canProceedFromQuestion && handleNext()}
                  disabled={!canProceedFromQuestion}
                  className={`mt-8 ${getActionButtonClasses(canProceedFromQuestion)}`}
                >
                  {currentQuestion === questions.length - 1 ? 'Complete' : 'Next question'}
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
