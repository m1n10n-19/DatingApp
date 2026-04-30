import { useState } from 'react';
import Landing from './components/Landing';
import PersonForm from './components/PersonForm';
import Analyzing from './components/Analyzing';
import Results from './components/Results';
import ModelSelector from './components/ModelSelector';
import { QUESTIONS, createInitialPerson } from './services/questions';

const STEPS = {
  LANDING: 'landing',
  PERSON_A: 'personA',
  PERSON_B: 'personB',
  ANALYZING: 'analyzing',
  RESULTS: 'results',
};

export default function App() {
  const [step, setStep] = useState(STEPS.LANDING);
  const [personA, setPersonA] = useState(createInitialPerson);
  const [personB, setPersonB] = useState(createInitialPerson);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState('groq');
  const [model, setModel] = useState('llama-3.3-70b-versatile');

  const handleStart = () => setStep(STEPS.PERSON_A);

  const handleModelChange = (newProvider, newModel) => {
    setProvider(newProvider);
    setModel(newModel);
  };

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
        body: JSON.stringify({ personA, personB: data, provider, model }),
      });

      if (!response.ok) {
        let errorMessage = 'Analysis failed. Please try again.';
        try {
          const errData = await response.json();
          errorMessage = errData.details || errData.error || errorMessage;
        } catch {
          // Response body wasn't valid JSON — use generic message
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setResults(result);
      setStep(STEPS.RESULTS);
    } catch (err) {
      console.error('Analysis error:', err);
      // Show user-friendly message for network/connection errors
      const isNetworkError = err instanceof TypeError && err.message.includes('fetch');
      setError(isNetworkError ? 'Unable to connect to the server. Please ensure the backend is running.' : err.message);
      setStep(STEPS.RESULTS);
    }
  };

  const handleReset = () => {
    setStep(STEPS.LANDING);
    setPersonA(createInitialPerson());
    setPersonB(createInitialPerson());
    setResults(null);
    setError(null);
  };

  // Show model selector on all steps except analyzing
  const showModelSelector = step !== STEPS.ANALYZING;

  return (
    <div className="min-h-screen">
      {showModelSelector && (
        <div className="fixed top-4 right-4 z-50">
          <ModelSelector
            selectedProvider={provider}
            selectedModel={model}
            onChange={handleModelChange}
          />
        </div>
      )}
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
