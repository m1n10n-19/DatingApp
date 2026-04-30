import { useState } from 'react';
import Landing from './components/Landing';
import Questionnaire from './components/Questionnaire';
import TruthPreamble from './components/TruthPreamble';
import ProfileLibrary from './components/ProfileLibrary';
import RelationshipStatus from './components/RelationshipStatus';
import Analyzing from './components/Analyzing';
import Results from './components/Results';
import ModelSelector from './components/ModelSelector';
import Settings from './components/Settings';
import { createInitialPerson } from './services/questions';
import { SAMPLE_PERSON_A, SAMPLE_PERSON_B } from './services/sampleData';
import { saveProfile } from './services/profileStore';
import { VIEWS } from './views';

export default function App() {
  const [view, setView] = useState(VIEWS.LANDING);
  const [questionnaireMode, setQuestionnaireMode] = useState(null); // 'fresh' | 'library_create' | null
  const [freshFlowStage, setFreshFlowStage] = useState(null); // 'A' | 'B' | null
  const [personA, setPersonA] = useState(null);
  const [personB, setPersonB] = useState(null);
  const [activeProfile, setActiveProfile] = useState(null);
  const [relationshipStatus, setRelationshipStatus] = useState('new_match');
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState('groq');
  const [model, setModel] = useState('llama-3.3-70b-versatile');
  const [repairLoading, setRepairLoading] = useState(false);
  const [repairError, setRepairError] = useState(null);
  const [simulateLoading, setSimulateLoading] = useState(false);
  const [simulateError, setSimulateError] = useState(null);
  const [individualRepairLoading, setIndividualRepairLoading] = useState(null);
  const [individualRepairError, setIndividualRepairError] = useState(null);

  // --- Handlers ---

  const handleStartFresh = () => {
    setQuestionnaireMode('fresh');
    setFreshFlowStage('A');
    setActiveProfile(createInitialPerson());
    setPersonA(null);
    setPersonB(null);
    setView(VIEWS.TRUTH);
  };

  const runAnalyze = async (pA, pB, status) => {
    setRelationshipStatus(status);
    setError(null);
    setView(VIEWS.ANALYZING);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personA: pA,
          personB: pB,
          relationshipStatus: status,
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
      setAnalysisData({
        personA: result.personA,
        personB: result.personB,
        compatibility: result.compatibility,
        repair: null,
        simulation: null,
      });
      setView(VIEWS.RESULTS);
    } catch (err) {
      console.error('Analysis error:', err);
      const isNetworkError = err instanceof TypeError && err.message.includes('fetch');
      setError(
        isNetworkError
          ? 'Unable to connect to the server. Please ensure the backend is running.'
          : err.message
      );
      setView(VIEWS.RESULTS);
    }
  };

  const handleTrySample = () => {
    setPersonA(SAMPLE_PERSON_A);
    setPersonB(SAMPLE_PERSON_B);
    setQuestionnaireMode(null);
    setFreshFlowStage(null);
    runAnalyze(SAMPLE_PERSON_A, SAMPLE_PERSON_B, 'new_match');
  };

  const handleOpenLibrary = () => {
    setView(VIEWS.LIBRARY);
  };

  const handleLibraryCreateNew = () => {
    setQuestionnaireMode('library_create');
    setFreshFlowStage(null);
    setActiveProfile(createInitialPerson());
    setView(VIEWS.TRUTH);
  };

  const handleLibraryPair = ({ personA: pA, personB: pB }) => {
    setPersonA(pA);
    setPersonB(pB);
    setQuestionnaireMode(null);
    setView(VIEWS.RELATIONSHIP_STATUS);
  };

  const handleTruthAccept = () => {
    setView(VIEWS.QUESTIONNAIRE);
  };

  const handleTruthBack = () => {
    if (questionnaireMode === 'library_create') {
      setView(VIEWS.LIBRARY);
    } else {
      setView(VIEWS.LANDING);
    }
  };

  const handleQuestionnaireComplete = (person) => {
    if (questionnaireMode === 'library_create') {
      saveProfile(person);
      setActiveProfile(null);
      setQuestionnaireMode(null);
      setView(VIEWS.LIBRARY);
    } else if (questionnaireMode === 'fresh') {
      if (freshFlowStage === 'A') {
        setPersonA(person);
        setFreshFlowStage('B');
        setActiveProfile(createInitialPerson());
        setView(VIEWS.QUESTIONNAIRE); // Skip truth preamble for B
      } else if (freshFlowStage === 'B') {
        setPersonB(person);
        setFreshFlowStage(null);
        setQuestionnaireMode(null);
        setActiveProfile(null);
        setView(VIEWS.RELATIONSHIP_STATUS);
      }
    }
  };

  const handleConfirmStatus = (status) => {
    runAnalyze(personA, personB, status);
  };

  // Generic fetch helper for repair/simulate endpoints (Simplify #4)
  const fetchPairEndpoint = async (endpoint, dataKey, setLoading, setErrorState, defaultErrorMsg) => {
    setLoading(true);
    setErrorState(null);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personA,
          personB,
          compatibility: analysisData.compatibility,
          relationshipStatus,
          provider,
          model,
        }),
      });

      if (!response.ok) {
        let errorMessage = defaultErrorMsg;
        try {
          const errData = await response.json();
          errorMessage = errData.details || errData.error || errorMessage;
        } catch {
          // Response body wasn't valid JSON
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setAnalysisData((prev) => ({ ...prev, [dataKey]: data[dataKey] }));
    } catch (err) {
      console.error(`${dataKey} error:`, err);
      const isNetworkError = err instanceof TypeError && err.message.includes('fetch');
      setErrorState(
        isNetworkError
          ? 'Unable to connect to the server. Please ensure the backend is running.'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRepair = () =>
    fetchPairEndpoint('/api/repair', 'repair', setRepairLoading, setRepairError, 'Repair generation failed. Please try again.');

  const handleRequestSimulate = () =>
    fetchPairEndpoint('/api/simulate', 'simulation', setSimulateLoading, setSimulateError, 'Simulation failed. Please try again.');

  const handleRequestIndividualRepair = async (person, personKey, onResult) => {
    setIndividualRepairLoading(personKey);
    setIndividualRepairError(null);
    try {
      const response = await fetch('/api/repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personA: person,
          relationshipStatus: relationshipStatus,
          provider,
          model,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Individual repair generation failed. Please try again.';
        try {
          const errData = await response.json();
          errorMessage = errData.details || errData.error || errorMessage;
        } catch {
          // Response body wasn't valid JSON
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      onResult(data.repair);
    } catch (err) {
      console.error('Individual repair error:', err);
      const isNetworkError = err instanceof TypeError && err.message.includes('fetch');
      setIndividualRepairError({
        key: personKey,
        message: isNetworkError
          ? 'Unable to connect to the server. Please ensure the backend is running.'
          : err.message,
      });
    } finally {
      setIndividualRepairLoading(null);
    }
  };

  const handleReset = () => {
    setView(VIEWS.LANDING);
    setPersonA(null);
    setPersonB(null);
    setActiveProfile(null);
    setQuestionnaireMode(null);
    setFreshFlowStage(null);
    setRelationshipStatus('new_match');
    setAnalysisData(null);
    setError(null);
    setRepairLoading(false);
    setRepairError(null);
    setSimulateLoading(false);
    setSimulateError(null);
    setIndividualRepairLoading(null);
    setIndividualRepairError(null);
  };

  const handleModelChange = (newProvider, newModel) => {
    setProvider(newProvider);
    setModel(newModel);
  };

  // Show model selector on all views except analyzing and settings
  const showModelSelector = view !== VIEWS.ANALYZING && view !== VIEWS.SETTINGS;

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
            onClick={() => setView(VIEWS.SETTINGS)}
            className="p-2 rounded-full bg-surface/60 border border-surface-light/50 text-text-dim hover:text-text hover:border-surface-light transition-all cursor-pointer"
            title="API Key Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      )}

      {view === VIEWS.LANDING && (
        <Landing
          onStart={handleStartFresh}
          onQuickTest={handleTrySample}
          onOpenLibrary={handleOpenLibrary}
        />
      )}

      {view === VIEWS.SETTINGS && <Settings onBack={() => setView(VIEWS.LANDING)} />}

      {view === VIEWS.LIBRARY && (
        <ProfileLibrary
          onCreateNew={handleLibraryCreateNew}
          onPairSelected={handleLibraryPair}
          onBack={() => setView(VIEWS.LANDING)}
        />
      )}

      {view === VIEWS.TRUTH && (
        <TruthPreamble
          onAccept={handleTruthAccept}
          onCancel={handleTruthBack}
        />
      )}

      {view === VIEWS.QUESTIONNAIRE && (
        <Questionnaire
          key={`questionnaire-${questionnaireMode}-${freshFlowStage ?? 'none'}`}
          personLabel={freshFlowStage ? `Person ${freshFlowStage}` : 'Profile'}
          initialPerson={activeProfile}
          onComplete={handleQuestionnaireComplete}
          onCancel={() => setView(VIEWS.TRUTH)}
        />
      )}

      {view === VIEWS.RELATIONSHIP_STATUS && (
        <RelationshipStatus
          personA={personA}
          personB={personB}
          onConfirm={handleConfirmStatus}
          onBack={() => setView(VIEWS.LANDING)}
        />
      )}

      {view === VIEWS.ANALYZING && <Analyzing personA={personA || {}} personB={personB || {}} />}

      {view === VIEWS.RESULTS && (
        <Results
          results={analysisData}
          error={error}
          personA={personA || {}}
          personB={personB || {}}
          onReset={handleReset}
          repairLoading={repairLoading}
          repairError={repairError}
          simulateLoading={simulateLoading}
          simulateError={simulateError}
          individualRepairLoading={individualRepairLoading}
          individualRepairError={individualRepairError}
          onRequestRepair={handleRequestRepair}
          onRequestSimulate={handleRequestSimulate}
          onRequestIndividualRepair={handleRequestIndividualRepair}
        />
      )}
    </div>
  );
}
