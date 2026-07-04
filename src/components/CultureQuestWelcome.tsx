import React from 'react';
import { Compass, Sparkles, MapPin, Search } from 'lucide-react';

interface CultureQuestWelcomeProps {
  onSelectPreset: (location: string, travelStyle: string) => void;
  onSearchSubmit: (location: string, travelStyle: string) => void;
  isLoading: boolean;
}

export default function CultureQuestWelcome({
  onSelectPreset,
  onSearchSubmit,
  isLoading,
}: CultureQuestWelcomeProps) {
  const [customLocation, setCustomLocation] = React.useState('');
  const [customStyle, setCustomStyle] = React.useState('');

  const presets = [
    {
      city: 'Kyoto',
      country: 'Japan',
      description: 'Step into serene Zen gardens, historic geisha districts, and discover ancestral Yuzen silk-dyeing workshops.',
      style: 'Zen, Tea culture, & Ancient crafts',
      tag: 'Far East'
    },
    {
      city: 'Oaxaca',
      country: 'Mexico',
      description: 'Immerse in indigenous culinary markets, vibrant Zapotec textile cooperatives, and sacred Day of the Dead rituals.',
      style: 'Culinary heritage & Zapotec arts',
      tag: 'Mesoamerica'
    },
    {
      city: 'Florence',
      country: 'Italy',
      description: 'Explore marble-paper family boutiques, historic leather guilds, and the preserved workshops of Renaissance masters.',
      style: 'Renaissance workshops & Paper guilds',
      tag: 'Mediterranean'
    },
    {
      city: 'Cairo',
      country: 'Egypt',
      description: 'Discover copper-beating bazaars, ancient Coptic churches, and the preservation of traditional tentmaker appliqués.',
      style: 'Copper bazaars & Nile antiquities',
      tag: 'Nile Valley'
    },
    {
      city: 'Cusco',
      country: 'Peru',
      description: 'Witness master Inca stone-masons, backstrap weavers of the Sacred Valley, and ancestral Andean farm blessings.',
      style: 'Inca masonry & Sacred Valley weavers',
      tag: 'Andean Highlands'
    }
  ];

  const indianPresets = [
    {
      city: 'Varanasi',
      country: 'India',
      description: 'Experience eternal Ganga Aarti ceremonies, navigate labyrinthine lanes, and discover ancestral handloom Banarasi silk weavers.',
      style: 'Spiritual rituals & handloom silk',
      tag: 'Sacred Ganges'
    },
    {
      city: 'Jaipur',
      country: 'India',
      description: 'Explore royal pink palaces, learn traditional wooden block printing, and visit multi-generational blue pottery studios.',
      style: 'Rajput crafts & blue pottery',
      tag: 'Royal Rajasthan'
    },
    {
      city: 'Madurai',
      country: 'India',
      description: 'Marvel at the towering Gopurams of Meenakshi Temple, inhale fragrant jasmine bazaars, and dive into classical Sangam history.',
      style: 'Dravidian temples & spice trade',
      tag: 'Temple Heartland'
    },
    {
      city: 'Hampi',
      country: 'India',
      description: 'Wander the monumental boulder-strewn ruins of the Vijayanagara Empire, monolithic temples, and active coracle ports.',
      style: 'Stone carving & imperial ruins',
      tag: 'Deccan Ruins'
    },
    {
      city: 'Kochi',
      country: 'India',
      description: 'Trace ancient spice trade routes, witness Kathakali classical dance-drama, and explore historic Jew Town workshops.',
      style: 'Spice coast & Sanskrit theater',
      tag: 'Malabar Coast'
    }
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLocation.trim() || isLoading) return;
    onSearchSubmit(customLocation, customStyle || 'Curious cultural explorer');
  };

  return (
    <div className="space-y-12 animate-fade-in" id="welcome-portal">
      {/* Hero Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4 py-6">
        <div className="inline-flex items-center gap-1.5 bg-[#F1EFE7] border border-[#E5E1D8] text-[#7D7C6E] px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase shadow-xs">
          <Compass className="w-4 h-4 animate-spin-slow" />
          The GenAI Cultural Discovery Platform
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#2C2926] tracking-tight leading-tight">
          Unveil the Soul of Your Next Destination
        </h1>
        <p className="text-[#4A443F] font-serif text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Wander past commercial corridors. Discover authentic local heritages, connect with ancestral artisans preserving endangered crafts, and explore community-first pathways curated by Generative AI.
        </p>
      </div>

      {/* Manual Search Console */}
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-[#E5E1D8] p-6 card-shadow">
        <h3 className="font-serif font-bold text-[#2C2926] text-base mb-3 flex items-center gap-2">
          <Search className="w-5 h-5 text-[#7D7C6E]" />
          Design Your Cultural Quest
        </h3>
        <form onSubmit={handleCustomSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#7D7C6E] uppercase tracking-wider mb-1">
              Where would you like to explore?
            </label>
            <input
              type="text"
              required
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              placeholder="e.g., Kyoto, Oaxaca, Rome, Cairo, or any city..."
              disabled={isLoading}
              className="w-full px-3.5 py-2 rounded-lg border border-[#E5E1D8] bg-[#F8F7F2]/40 text-sm text-[#4A443F] focus:outline-none focus:border-[#7D7C6E] focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#7D7C6E] uppercase tracking-wider mb-1">
              Your Travel Mindset / Specific Interests (Optional)
            </label>
            <input
              type="text"
              value={customStyle}
              onChange={(e) => setCustomStyle(e.target.value)}
              placeholder="e.g., Traditional wood crafts, ancient tea ceremonies, local recipes..."
              disabled={isLoading}
              className="w-full px-3.5 py-2 rounded-lg border border-[#E5E1D8] bg-[#F8F7F2]/40 text-sm text-[#4A443F] focus:outline-none focus:border-[#7D7C6E] focus:bg-white transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#7D7C6E] hover:bg-[#7D7C6E]/90 text-white py-2.5 rounded-full text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-stone-200 border-t-white rounded-full animate-spin"></div>
                Unearthing heritage files...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#F1EFE7]" />
                Generate Cultural Blueprint
              </>
            )}
          </button>
        </form>
      </div>

      {/* Presets Cards Grid */}
      <div className="space-y-4 pt-4">
        <h3 className="font-serif text-xl font-bold text-[#2C2926] text-center flex items-center justify-center gap-2">
          <Compass className="w-5 h-5 text-[#7D7C6E]" />
          Featured Curated Pilgrimages
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {presets.map((preset, index) => (
            <div
              key={index}
              onClick={() => !isLoading && onSelectPreset(preset.city, preset.style)}
              className="bg-white border border-[#E5E1D8] hover:border-[#7D7C6E] rounded-2xl p-5 card-shadow hover:shadow-md cursor-pointer transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-sans font-bold uppercase tracking-wider bg-[#F1EFE7] text-[#7D7C6E] px-2 py-0.5 rounded">
                    {preset.tag}
                  </span>
                  <MapPin className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#7D7C6E] transition-colors" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-[#2C2926] text-lg group-hover:text-[#7D7C6E] transition-colors">
                    {preset.city}
                  </h4>
                  <p className="text-xs text-[#7D7C6E] font-medium">{preset.country}</p>
                </div>
                <p className="text-xs text-[#4A443F] font-serif leading-relaxed line-clamp-4">
                  {preset.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5E1D8]/50 text-[11px] text-[#7D7C6E] font-semibold italic">
                Focus: {preset.style}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Indian Presets Grid */}
      <div className="space-y-4 pt-4">
        <h3 className="font-serif text-xl font-bold text-[#2C2926] text-center flex items-center justify-center gap-2">
          <Compass className="w-5 h-5 text-[#7D7C6E]" />
          Vibrant Heritages of India
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {indianPresets.map((preset, index) => (
            <div
              key={index}
              onClick={() => !isLoading && onSelectPreset(preset.city, preset.style)}
              className="bg-white border border-[#E5E1D8] hover:border-[#7D7C6E] rounded-2xl p-5 card-shadow hover:shadow-md cursor-pointer transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-sans font-bold uppercase tracking-wider bg-[#F1EFE7] text-[#7D7C6E] px-2 py-0.5 rounded">
                    {preset.tag}
                  </span>
                  <MapPin className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#7D7C6E] transition-colors" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-[#2C2926] text-lg group-hover:text-[#7D7C6E] transition-colors">
                    {preset.city}
                  </h4>
                  <p className="text-xs text-[#7D7C6E] font-medium">{preset.country}</p>
                </div>
                <p className="text-xs text-[#4A443F] font-serif leading-relaxed line-clamp-4">
                  {preset.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5E1D8]/50 text-[11px] text-[#7D7C6E] font-semibold italic">
                Focus: {preset.style}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
