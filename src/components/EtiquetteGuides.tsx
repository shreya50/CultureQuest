import React from 'react';
import { ShieldAlert, CheckCircle2, Heart, Award, HelpCircle } from 'lucide-react';
import { CulturalEtiquette, TraditionalCraft } from '../types';

interface EtiquetteGuidesProps {
  etiquetteGuides: CulturalEtiquette[];
  traditionalCrafts: TraditionalCraft[];
}

export default function EtiquetteGuides({
  etiquetteGuides,
  traditionalCrafts,
}: EtiquetteGuidesProps) {
  return (
    <div className="space-y-6" id="etiquette-and-crafts">
      {/* Etiquette Block */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-[#7D7C6E]" />
          <h3 className="font-serif text-lg font-medium text-[#2C2926]">
            Respect Code & Mindful Tourism
          </h3>
        </div>
        
        {etiquetteGuides.length === 0 ? (
          <p className="text-xs text-[#4A443F]/60 italic">No etiquette guides loaded. Search for a destination to reveal respect protocols.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {etiquetteGuides.map((guide, idx) => (
              <div 
                key={idx} 
                className="bg-[#F8F7F2] border border-[#E5E1D8] rounded-xl p-4 card-shadow hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-serif font-semibold text-[#2C2926] border-b border-[#E5E1D8] pb-2 text-sm">
                    {idx + 1}. {guide.rule}
                  </h4>
                  <p className="text-xs text-[#4A443F] font-serif leading-relaxed mt-2 italic">
                    "{guide.explanation}"
                  </p>
                </div>

                <div className="mt-3.5 space-y-2 bg-[#F1EFE7] p-2.5 rounded-lg border border-[#E5E1D8]">
                  <div className="flex items-start gap-1.5 text-xs text-[#7D7C6E]">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-sans font-semibold">Common Tourist Mistake: </span>
                      <span className="font-sans text-[#4A443F]">{guide.commonMistake}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 text-xs text-[#7D7C6E]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-sans font-semibold text-[#2C2926]">Respectful Alternative: </span>
                      <span className="font-sans text-[#4A443F]">{guide.respectfulAlternative}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Traditional Crafts & Preservation Status Block */}
      <div className="border-t border-[#E5E1D8] pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-[#7D7C6E]" />
          <h3 className="font-serif text-lg font-medium text-[#2C2926]">
            Traditional Crafts & Indigenous Arts
          </h3>
        </div>

        {traditionalCrafts.length === 0 ? (
          <p className="text-xs text-[#4A443F]/60 italic">No traditional crafts loaded. Search for a destination to explore heritage craft preservation.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {traditionalCrafts.map((craft, idx) => {
              const isEndangered = craft.preservationStatus.toLowerCase().includes('endangered') || 
                                  craft.preservationStatus.toLowerCase().includes('rare') ||
                                  craft.preservationStatus.toLowerCase().includes('status: critical');
              
              return (
                <div 
                  key={idx} 
                  className="bg-[#F8F7F2] border border-[#E5E1D8] rounded-xl p-4 flex flex-col justify-between card-shadow"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif font-bold text-[#2C2926] text-sm leading-tight">
                        {craft.name}
                      </h4>
                      <span className={`text-[9px] font-sans font-semibold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                        isEndangered 
                          ? 'bg-[#E5E1D8] text-[#4A443F] border border-[#E5E1D8]' 
                          : 'bg-[#7D7C6E] text-white border border-[#7D7C6E]'
                      }`}>
                        {craft.preservationStatus}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#4A443F]/80 font-medium">By: {craft.artisanType}</p>
                    <p className="text-xs text-[#4A443F] leading-relaxed font-serif">
                      {craft.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E5E1D8] text-[11px] text-[#4A443F]">
                    <span className="font-sans font-semibold text-[#2C2926]">How to Witness: </span>
                    <span className="font-serif italic text-[#4A443F]">{craft.whereToWitness}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
