import { useState } from 'react';
import Landing from './components/Landing';
import PersonForm from './components/PersonForm';
import Analyzing from './components/Analyzing';
import Results from './components/Results';
import ModelSelector from './components/ModelSelector';
import Settings from './components/Settings';
import { QUESTIONS, createInitialPerson } from './services/questions';
import { SAMPLE_PERSON_A, SAMPLE_PERSON_B } from './services/sampleData';

const STEPS = {
  LANDING: 'landing',
  SETTINGS: 'settings',
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

  const handleQuickTest = async () => {
    setPersonA(SAMPLE_PERSON_A);
    setPersonB(SAMPLE_PERSON_B);
    setStep(STEPS.ANALYZING);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personA: SAMPLE_PERSON_A,
          personB: SAMPLE_PERSON_B,
          provider,
          model,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Analysis failed. Please try again.';
        try {
          const errData = await response.json();
          errorMessage = errData.details || errData.error || errorMessage;
        } catch {
          // Response body wasn't valid JSON
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setResults(result);
      setStep(STEPS.RESULTS);
    } catch (err) {
      console.error('Analysis error:', err);
      const isNetworkError = err instanceof TypeError && err.message.includes('fetch');
      setError(isNetworkError ? 'Unable to connect to the server. Please ensure the backend is running.' : err.message);
      setStep(STEPS.RESULTS);
    }
  };

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

  // Show model selector on all steps except analyzing and settings
  const showModelSelector = step !== STEPS.ANALYZING && step !== STEPS.SETTINGS;

  return (
    <div className="min-h-screen">
      {showModelSelector && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <ModelSelector
            selectedProvider={provider}
            selectedModel={model}
            onChange={handleModelChange}
          />
          <button
            onClick={() => setStep(STEPS.SETTINGS)}
            className="p-2 rounded-full bg-surface/60 border border-surface-light/50 text-text-dim hover:text-text hover:border-surface-light transition-all cursor-pointer"
            title="API Key Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      )}
      {step === STEPS.LANDING && <Landing onStart={handleStart} onQuickTest={handleQuickTest} />}
      {step === STEPS.SETTINGS && <Settings onBack={() => setStep(STEPS.LANDING)} />}
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
