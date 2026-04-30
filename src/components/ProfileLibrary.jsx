import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Users, ArrowRight } from 'lucide-react';
import ProfilePreviewCard from './ProfilePreviewCard';
import { listProfiles, deleteProfile } from '../services/profileStore';
import { getActionButtonClasses } from '../utils/styles';

export default function ProfileLibrary({ onCreateNew, onPairSelected, onBack }) {
  const [profiles, setProfiles] = useState(() => listProfiles());
  const [selectedA, setSelectedA] = useState(null);
  const [selectedB, setSelectedB] = useState(null);

  const refreshProfiles = useCallback(() => {
    setProfiles(listProfiles());
  }, []);

  useEffect(() => {
    const handleStorage = () => refreshProfiles();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refreshProfiles]);

  const handleSelect = (profile) => {
    if (!selectedA || selectedA.id === profile.id) {
      // Toggle A
      setSelectedA(selectedA?.id === profile.id ? null : profile);
    } else if (!selectedB || selectedB.id === profile.id) {
      // Toggle B
      setSelectedB(selectedB?.id === profile.id ? null : profile);
    } else {
      // Both slots full, replace B
      setSelectedB(profile);
    }
  };

  const handleDelete = (id) => {
    deleteProfile(id);
    refreshProfiles();
    if (selectedA?.id === id) setSelectedA(null);
    if (selectedB?.id === id) setSelectedB(null);
  };

  const canContinue = selectedA && selectedB && selectedA.id !== selectedB.id;

  return (
    <div className="min-h-screen flex flex-col px-6 pt-8 pb-16">
      <div className="max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-text-dim hover:text-text transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            <h1 className="text-xl font-serif font-bold text-text">My Profiles</h1>
          </div>
        </div>

        {/* Selection slots */}
        <div className="mb-6 bg-surface/30 border border-surface-light/30 rounded-xl p-4">
          <p className="text-sm text-text-dim mb-3">Select two profiles to analyze:</p>
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-lg border border-dashed p-3 text-center text-sm ${
              selectedA ? 'border-accent/40 bg-accent/5' : 'border-surface-light text-text-faint'
            }`}>
              {selectedA ? (
                <span className="text-accent font-medium">A: {selectedA.name}</span>
              ) : (
                <span>Person A — tap a profile</span>
              )}
            </div>
            <div className={`rounded-lg border border-dashed p-3 text-center text-sm ${
              selectedB ? 'border-accent/40 bg-accent/5' : 'border-surface-light text-text-faint'
            }`}>
              {selectedB ? (
                <span className="text-accent font-medium">B: {selectedB.name}</span>
              ) : (
                <span>Person B — tap a profile</span>
              )}
            </div>
          </div>
        </div>

        {/* Create new button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onCreateNew}
          className="w-full mb-6 inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface/40 border border-surface-light/50 rounded-xl text-base text-text-dim hover:text-text hover:border-surface-light transition-all duration-300 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create new profile
        </motion.button>

        {/* Profile list */}
        {profiles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-dim mb-2">No saved profiles yet.</p>
            <p className="text-sm text-text-faint">Create one to get started.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {profiles.map((profile) => (
              <ProfilePreviewCard
                key={profile.id}
                profile={profile}
                selected={selectedA?.id === profile.id || selectedB?.id === profile.id}
                onSelect={handleSelect}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Continue button */}
        {profiles.length > 0 && (
          <div className="mt-8">
            <motion.button
              whileHover={{ scale: canContinue ? 1.02 : 1 }}
              whileTap={{ scale: canContinue ? 0.98 : 1 }}
              onClick={() => canContinue && onPairSelected({ personA: selectedA, personB: selectedB })}
              disabled={!canContinue}
              className={getActionButtonClasses(canContinue)}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
