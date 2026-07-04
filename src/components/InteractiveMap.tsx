import React, { useState } from 'react';
import { MapPin, Compass, Landmark, Eye, Heart } from 'lucide-react';
import { Attraction, HiddenGem } from '../types';
import { motion } from 'motion/react';

interface InteractiveMapProps {
  locationName: string;
  attractions: Attraction[];
  hiddenGems: HiddenGem[];
  activeItemId: string | null;
  onSelectItem: (id: string, type: 'attraction' | 'gem') => void;
}

export default function InteractiveMap({
  locationName,
  attractions,
  hiddenGems,
  activeItemId,
  onSelectItem,
}: InteractiveMapProps) {
  const [hoveredItem, setHoveredItem] = useState<{ id: string; name: string; type: 'attraction' | 'gem' } | null>(null);

  // Map offset coordinate conversion: from [-100, 100] to SVG viewbox [50, 450]
  const mapCoords = (offset: number, size: number) => {
    // scale from [-100, 100] to [40, size - 40]
    const minVal = -100;
    const maxVal = 100;
    const minTarget = 50;
    const maxTarget = size - 50;
    
    // clamp offset
    const clamped = Math.max(minVal, Math.min(maxVal, offset));
    return minTarget + ((clamped - minVal) * (maxTarget - minTarget)) / (maxVal - minVal);
  };

  const width = 500;
  const height = 400;

  return (
    <div className="relative bg-[#F1EFE7] rounded-2xl border border-[#E5E1D8] p-6 card-shadow overflow-hidden flex flex-col h-full select-none" id="interactive-map-container">
      {/* Map Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-[#7D7C6E] animate-spin-slow" />
          <h3 className="font-serif text-lg font-medium text-[#2C2926]">
            Interactive Cultural Topology: <span className="text-[#7D7C6E] font-semibold">{locationName}</span>
          </h3>
        </div>
        <div className="flex gap-4 text-xs font-medium text-[#4A443F]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#7D7C6E] border border-white shadow-sm inline-block"></span>
            <span>Heritage Landmarks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#7D7C6E]/60 border border-white shadow-sm inline-block"></span>
            <span>Hidden Gems</span>
          </div>
        </div>
      </div>

      {/* Map Canvas Frame */}
      <div className="relative flex-1 bg-[#EBE9E1] rounded-2xl border border-[#E5E1D8] overflow-hidden group">
        {/* Topographic Aesthetic Lines */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[radial-gradient(#7D7C6E_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full relative z-10"
        >
          {/* Aesthetic grid coordinates */}
          <line x1="50" y1="200" x2="450" y2="200" stroke="#7D7C6E" strokeWidth="0.5" strokeDasharray="4 6" opacity="0.15" />
          <line x1="250" y1="50" x2="250" y2="350" stroke="#7D7C6E" strokeWidth="0.5" strokeDasharray="4 6" opacity="0.15" />
          <circle cx="250" cy="200" r="100" fill="none" stroke="#7D7C6E" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.15" />
          <circle cx="250" cy="200" r="180" fill="none" stroke="#7D7C6E" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.1" />

          {/* Connective pathway lines to show a local route */}
          {attractions.length > 1 && (
            <path
              d={`M ${attractions.map(a => `${mapCoords(a.longitudeOffset, width)} ${mapCoords(a.latitudeOffset, height)}`).join(' L ')}`}
              fill="none"
              stroke="#7D7C6E"
              strokeWidth="1.5"
              strokeDasharray="5 5"
              className="opacity-25"
            />
          )}

          {/* Heritage Attraction Nodes */}
          {attractions.map((attr, index) => {
            const cx = mapCoords(attr.longitudeOffset, width);
            const cy = mapCoords(attr.latitudeOffset, height);
            const isActive = activeItemId === attr.id;
            
            return (
              <g 
                key={attr.id}
                className="cursor-pointer"
                onClick={() => onSelectItem(attr.id, 'attraction')}
                onMouseEnter={() => setHoveredItem({ id: attr.id, name: attr.name, type: 'attraction' })}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Active ripple effect */}
                {isActive && (
                  <circle cx={cx} cy={cy} r="22" fill="none" stroke="#7D7C6E" strokeWidth="1" className="animate-ping" opacity="0.4" />
                )}
                
                {/* Hover outline */}
                <circle cx={cx} cy={cy} r="15" fill="#F8F7F2" className="transition-all duration-200" opacity={hoveredItem?.id === attr.id || isActive ? "0.9" : "0"} />
                
                {/* Base Node */}
                <circle 
                  cx={cx} 
                  cy={cy} 
                  r={isActive ? "9" : "7"} 
                  className="transition-all duration-300 fill-[#7D7C6E] stroke-white hover:scale-125" 
                  strokeWidth="2"
                  id={`map-node-${attr.id}`}
                />
                
                {/* Visual Icon indicator */}
                <foreignObject x={cx - 10} y={cy - 22} width="20" height="20" className="pointer-events-none">
                  <div className="text-white font-bold text-[9px] text-center flex items-center justify-center h-full">
                    {index + 1}
                  </div>
                </foreignObject>
              </g>
            );
          })}

          {/* Hidden Gem Nodes */}
          {hiddenGems.map((gem) => {
            const cx = mapCoords(gem.longitudeOffset, width);
            const cy = mapCoords(gem.latitudeOffset, height);
            const isActive = activeItemId === gem.id;

            return (
              <g 
                key={gem.id}
                className="cursor-pointer"
                onClick={() => onSelectItem(gem.id, 'gem')}
                onMouseEnter={() => setHoveredItem({ id: gem.id, name: gem.name, type: 'gem' })}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Active ripple effect */}
                {isActive && (
                  <circle cx={cx} cy={cy} r="20" fill="none" stroke="#7D7C6E" strokeWidth="1" className="animate-ping" opacity="0.4" />
                )}

                {/* Hover outline */}
                <circle cx={cx} cy={cy} r="14" fill="#F1EFE7" className="transition-all duration-200" opacity={hoveredItem?.id === gem.id || isActive ? "0.9" : "0"} />

                {/* Base Node */}
                <circle 
                  cx={cx} 
                  cy={cy} 
                  r={isActive ? "8" : "6"} 
                  className="transition-all duration-300 fill-[#7D7C6E]/70 stroke-white hover:scale-125" 
                  strokeWidth="2"
                  id={`map-node-${gem.id}`}
                />

                {/* Visual Icon indicators (sparkle pin) */}
                <circle cx={cx} cy={cy} r="2" fill="white" className="pointer-events-none" />
              </g>
            );
          })}
        </svg>

        {/* Dynamic Map HUD Tooltip */}
        {hoveredItem && (
          <div className="absolute bottom-4 left-4 right-4 bg-[#2C2926]/95 backdrop-blur-sm text-[#F8F7F2] py-2 px-4 rounded-lg text-sm flex items-center justify-between border border-[#7D7C6E] shadow-lg animate-fade-in z-20">
            <div className="flex items-center gap-2">
              {hoveredItem.type === 'attraction' ? (
                <Landmark className="w-4 h-4 text-[#7D7C6E]" />
              ) : (
                <Eye className="w-4 h-4 text-[#7D7C6E]/80" />
              )}
              <span className="font-serif font-medium">{hoveredItem.name}</span>
            </div>
            <span className="text-[10px] tracking-wider uppercase bg-[#7D7C6E] px-2 py-0.5 rounded text-white font-sans font-semibold">
              {hoveredItem.type === 'attraction' ? 'Heritage Attraction' : 'Hidden Gem'}
            </span>
          </div>
        )}

        {/* Instructions overlay */}
        <div className="absolute top-3 right-3 bg-[#F8F7F2]/95 backdrop-blur-sm px-2.5 py-1.5 rounded-md border border-[#E5E1D8] text-[10px] text-[#4A443F] pointer-events-none z-15 select-none shadow-xs">
          Click nodes to explore cultural backstory
        </div>
      </div>

      {/* Small selected summary */}
      <div className="mt-4 pt-4 border-t border-[#E5E1D8] min-h-[50px] flex items-center">
        {(() => {
          const selectedAttr = attractions.find(a => a.id === activeItemId);
          const selectedGem = hiddenGems.find(g => g.id === activeItemId);
          
          if (selectedAttr) {
            return (
              <div className="flex items-start gap-3 w-full">
                {selectedAttr.imageUrl ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-[#E5E1D8] bg-[#EBE9E1]">
                    <img
                      src={selectedAttr.imageUrl}
                      alt={selectedAttr.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="p-2.5 bg-[#F1EFE7] text-[#7D7C6E] rounded-lg shrink-0">
                    <Landmark className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h4 className="font-serif text-sm font-semibold text-[#2C2926] leading-snug">{selectedAttr.name}</h4>
                  <p className="text-xs text-[#4A443F] line-clamp-2">{selectedAttr.description}</p>
                </div>
              </div>
            );
          }
          if (selectedGem) {
            return (
              <div className="flex items-start gap-3 w-full">
                {selectedGem.imageUrl ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-[#E5E1D8] bg-[#EBE9E1]">
                    <img
                      src={selectedGem.imageUrl}
                      alt={selectedGem.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="p-2.5 bg-[#F1EFE7] text-[#7D7C6E] rounded-lg shrink-0">
                    <Heart className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h4 className="font-serif text-sm font-semibold text-[#2C2926] leading-snug">{selectedGem.name}</h4>
                  <p className="text-xs text-[#4A443F] line-clamp-2">{selectedGem.description}</p>
                </div>
              </div>
            );
          }
          return (
            <p className="text-xs italic text-[#4A443F]/60 text-center w-full">
              Select any point on the topology map above to unveil its lore, significance, and cultural tips.
            </p>
          );
        })()}
      </div>
    </div>
  );
}
