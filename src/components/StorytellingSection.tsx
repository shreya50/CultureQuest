import React from 'react';
import { BookOpen, Sparkles, Scroll, History, Eye, Volume2 } from 'lucide-react';
import { ImmersiveStory } from '../types';

interface StorytellingSectionProps {
  locationName: string;
  activeItemName: string | null;
  activeItemType: string | null;
  activeStory: ImmersiveStory | null;
  onFetchStory: (landmarkName: string, type: string) => Promise<void>;
  isLoadingStory: boolean;
}

export default function StorytellingSection({
  locationName,
  activeItemName,
  activeItemType,
  activeStory,
  onFetchStory,
  isLoadingStory,
}: StorytellingSectionProps) {

  // Simple text-to-speech option for accessibility and immersive storytelling
  const handleSpeak = () => {
    if (!activeStory) return;
    const utterance = new SpeechSynthesisUtterance(activeStory.narrativeText);
    // Try to pick a pleasant, slower voice if possible
    utterance.rate = 0.9;
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeak = () => {
    window.speechSynthesis.cancel();
  };

  return (
    <div className="bg-[#F8F7F2]/40 rounded-2xl border border-[#E5E1D8] p-6 card-shadow flex flex-col h-full relative overflow-hidden" id="storytelling-section">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#7D7C6E]/20 rounded-tl-md pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#7D7C6E]/20 rounded-tr-md pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#7D7C6E]/20 rounded-bl-md pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#7D7C6E]/20 rounded-br-md pointer-events-none"></div>

      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E5E1D8]">
        <Scroll className="w-5 h-5 text-[#7D7C6E]" />
        <h3 className="font-serif text-lg font-medium text-[#2C2926]">Immersive Lore & Oral Histories</h3>
      </div>

      {!activeItemName ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3 min-h-[250px]">
          <BookOpen className="w-12 h-12 text-[#7D7C6E]/40 stroke-1" />
          <div>
            <p className="font-serif text-[#2C2926] font-semibold">Ancient Voices & Legends</p>
            <p className="text-xs text-[#4A443F] max-w-xs mt-1 leading-relaxed">
              Select any heritage attraction or hidden gem from the map or panels, then click here to hear its legendary story and folklore passed down through generations.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Context bar */}
            <div className="flex items-center justify-between mb-4 bg-[#F1EFE7] px-3 py-1.5 rounded-lg border border-[#E5E1D8]">
              <span className="text-xs text-[#4A443F] font-medium">
                Focus: <span className="text-[#7D7C6E] font-bold">{activeItemName}</span>
              </span>
              <span className="text-[10px] bg-[#7D7C6E] text-white px-2 py-0.5 rounded font-semibold uppercase tracking-wide">
                {activeItemType || 'Heritage Spot'}
              </span>
            </div>

            {/* Story display or Fetch prompt */}
            {!activeStory && !isLoadingStory && (
              <div className="flex flex-col items-center justify-center text-center py-10 px-4 space-y-4">
                <p className="text-sm font-serif text-[#4A443F] italic leading-relaxed">
                  "Every stone, workshop, and temple has an elder's tale. Unveil the story of {activeItemName}."
                </p>
                <button
                  onClick={() => onFetchStory(activeItemName, activeItemType || '')}
                  className="bg-[#7D7C6E] hover:bg-[#7D7C6E]/90 text-white font-serif text-sm px-5 py-2.5 rounded-full shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer border border-[#7D7C6E]"
                >
                  <Sparkles className="w-4 h-4 text-[#F1EFE7]" />
                  Listen to Elder's Narrative
                </button>
              </div>
            )}

            {/* Loading state */}
            {isLoadingStory && (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="relative">
                  <div className="w-10 h-10 border-4 border-[#E5E1D8] border-t-[#7D7C6E] rounded-full animate-spin"></div>
                  <History className="w-4 h-4 text-[#7D7C6E] absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-serif text-[#2C2926]">Translating oral traditions...</p>
                  <p className="text-[11px] text-[#4A443F] mt-0.5">Sora is consulting the village chroniclers</p>
                </div>
              </div>
            )}

            {/* Rendered Story */}
            {activeStory && !isLoadingStory && (
              <div className="space-y-4 animate-fade-in text-[#2C2926]">
                {/* Epoch/Era tag */}
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#7D7C6E] font-sans">
                  <History className="w-3.5 h-3.5" />
                  Era Backdrop: {activeStory.era}
                </div>

                {/* Narrative with Dropcap style */}
                <div className="font-serif text-sm leading-relaxed text-[#4A443F] max-h-[220px] overflow-y-auto pr-2 [scrollbar-width:thin]">
                  <p className="first-letter:text-4xl first-letter:font-bold first-letter:text-[#7D7C6E] first-letter:mr-2 first-letter:float-left first-letter:leading-none whitespace-pre-line">
                    {activeStory.narrativeText}
                  </p>
                </div>

                {/* Legend callout */}
                <div className="bg-[#F1EFE7] border-l-4 border-[#7D7C6E] p-3.5 rounded-r-lg">
                  <h5 className="text-xs font-semibold text-[#2C2926] font-sans uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#7D7C6E]" />
                    Ancestral Legend & Wisdom
                  </h5>
                  <p className="text-xs font-serif italic text-[#4A443F] leading-relaxed">
                    "{activeStory.folkloreOrLegend}"
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Audio read-aloud utilities */}
          {activeStory && !isLoadingStory && (
            <div className="mt-4 pt-4 border-t border-[#E5E1D8] flex items-center justify-between">
              <span className="text-[10px] text-[#4A443F]/60 italic">Click speak to listen to the elder's voice</span>
              <div className="flex gap-2">
                <button
                  onClick={handleSpeak}
                  className="bg-[#F1EFE7] hover:bg-[#EBE9E1] text-[#4A443F] px-3.5 py-1.5 rounded-full border border-[#E5E1D8] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[#7D7C6E]" />
                  Speak Lore
                </button>
                <button
                  onClick={handleStopSpeak}
                  className="bg-[#EBE9E1] hover:bg-[#EBE9E1]/80 text-[#4A443F] px-3.5 py-1.5 rounded-full border border-[#E5E1D8] text-xs font-medium cursor-pointer transition-colors"
                >
                  Stop
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
