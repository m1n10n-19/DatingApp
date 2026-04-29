import { useState } from 'react';
import Landing from './components/Landing';
import PersonForm from './components/PersonForm';
import Analyzing from './components/Analyzing';
import Results from './components/Results';
import { QUESTIONS } from './services/questions';

const STEPS = {
  LANDING: 'landing',
  PERSON_A: 'personA',
  PERSON_B: 'personB',
  ANALYZING: 'analyzing',
  RESULTS: 'results',
};

export default function App() {
  const [step, setStep] = useState(STEPS.LANDING);
  const [personA, setPersonA] = useState({ name: '', gender: '', answers: ['', '', ''] });
  const [personB, setPersonB] = useState({ name: '', gender: '', answers: ['', '', ''] });
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleStart = () => setStep(STEPS.PERSON_A);

  const handlePersonAComplete = (data) => {
    setPersonA(data);
    setStep(STEPS.PERSON_B);
  };

  const handlePersonBComplete = async (data) => {
    setPersonB(data);
    setStep(STEPS.ANALYZING);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personA, personB: data }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.details || errData.error || 'Analysis failed');
      }

      const result = await response.json();
      setResults(result);
      setStep(STEPS.RESULTS);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message);
      setStep(STEPS.RESULTS);
    }
  };

  const handleReset = () => {
    setStep(STEPS.LANDING);
    setPersonA({ name: '', gender: '', answers: ['', '', ''] });
    setPersonB({ name: '', gender: '', answers: ['', '', ''] });
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen">
      {step === STEPS.LANDING && <Landing onStart={handleStart} />}
      {step === STEPS.PERSON_A && (
        <PersonForm
          label="Person A"
          personNumber={1}
          questions={QUESTIONS}
          onComplete={handlePersonAComplete}
          onBack={() => setStep(STEPS.LANDING)}
        />
      )}
      {step === STEPS.PERSON_B && (
        <PersonForm
          label="Person B"
          personNumber={2}
          questions={QUESTIONS}
          onComplete={handlePersonBComplete}
          onBack={() => setStep(STEPS.PERSON_A)}
        />
      )}
      {step === STEPS.ANALYZING && <Analyzing personA={personA} personB={personB} />}
      {step === STEPS.RESULTS && (
        <Results
          results={results}
          error={error}
          personA={personA}
          personB={personB}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
