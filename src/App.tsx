import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, MapPin, Search, ArrowLeft, Landmark, Eye, Calendar, BookOpen, Heart, Volume2, VolumeX, AlertCircle, RefreshCw, Accessibility } from 'lucide-react';
import { DiscoveryResponse, ChatMessage, ImmersiveStory } from './types';
import InteractiveMap from './components/InteractiveMap';
import VirtualGuideChat from './components/VirtualGuideChat';
import StorytellingSection from './components/StorytellingSection';
import EtiquetteGuides from './components/EtiquetteGuides';
import CultureQuestWelcome from './components/CultureQuestWelcome';

// Helper to get a beautiful and stable image url with suitable fallback
const getAttractionImage = (imageUrl?: string, type?: string) => {
  if (imageUrl && imageUrl.startsWith('http')) {
    return imageUrl;
  }
  // Curated fallbacks based on type
  switch (type) {
    case 'heritage':
      return 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop&q=80'; // Ancient heritage
    case 'nature':
      return 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80'; // Mountain landscape
    case 'art':
      return 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=80'; // Museum / art
    case 'culinary':
      return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80'; // Traditional food
    case 'craft':
      return 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80'; // Craft studio
    default:
      return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop&q=80'; // General scenic travel
  }
};

export default function App() {
  // Discovery State
  const [currentDiscovery, setCurrentDiscovery] = useState<DiscoveryResponse | null>(null);
  const [searchHistory, setSearchHistory] = useState<{ location: string; country: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Storyteller State
  const [activeStory, setActiveStory] = useState<ImmersiveStory | null>(null);
  const [isLoadingStory, setIsLoadingStory] = useState(false);

  // Active Spot detail focus
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [activeItemName, setActiveItemName] = useState<string | null>(null);
  const [activeItemType, setActiveItemType] = useState<string | null>(null);

  // Tabs for the details pane
  const [activeTab, setActiveTab] = useState<'attractions' | 'gems' | 'events' | 'mindful' | 'story'>('attractions');

  // Accessibility States
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [readabilityFont, setReadabilityFont] = useState(false);
  const [ttsSpeechEnabled, setTtsSpeechEnabled] = useState(false);
  const [currentlySpeaking, setCurrentlySpeaking] = useState<string | null>(null);
  const [isAccessibilityMenuOpen, setIsAccessibilityMenuOpen] = useState(false);

  // Stop any active speech on unmount or city change
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentDiscovery]);

  const handleToggleSpeak = (text: string, identifier: string) => {
    if (!window.speechSynthesis) return;

    if (currentlySpeaking === identifier) {
      window.speechSynthesis.cancel();
      setCurrentlySpeaking(null);
    } else {
      window.speechSynthesis.cancel();
      
      // Clean up text if it contains markdown or HTML tags
      const cleanText = text.replace(/[*#_`\-]/g, '');
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.onend = () => {
        setCurrentlySpeaking(null);
      };
      utterance.onerror = () => {
        setCurrentlySpeaking(null);
      };
      setCurrentlySpeaking(identifier);
      window.speechSynthesis.speak(utterance);
    }
  };

  const getAccessibilityClasses = () => {
    let classes = "";
    if (fontSize === 'large') classes += " accessibility-scale-large";
    if (fontSize === 'huge') classes += " accessibility-scale-huge";
    if (readabilityFont) classes += " accessibility-readability";
    if (highContrast) classes += " accessibility-high-contrast";
    return classes;
  };

  // Load search history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('culture_quest_history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Error reading history:", e);
      }
    }
  }, []);

  // Update active item names/types when activeItemId changes
  useEffect(() => {
    if (!currentDiscovery || !activeItemId) {
      setActiveItemName(null);
      setActiveItemType(null);
      return;
    }

    const attraction = currentDiscovery.attractions.find(a => a.id === activeItemId);
    if (attraction) {
      setActiveItemName(attraction.name);
      setActiveItemType(attraction.type);
      return;
    }

    const gem = currentDiscovery.hiddenGems.find(g => g.id === activeItemId);
    if (gem) {
      setActiveItemName(gem.name);
      setActiveItemType('Hidden Gem');
      return;
    }
  }, [activeItemId, currentDiscovery]);

  // Handle Location Search
  const handleSearch = async (location: string, travelStyle: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentDiscovery(null);
    setChatMessages([]);
    setActiveStory(null);
    setActiveItemId(null);

    try {
      const response = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, travelStyle })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Discovery API error: Status ${response.status}`);
      }

      const data: DiscoveryResponse = await response.json();
      setCurrentDiscovery(data);

      // Save to search history
      const newHistory = [
        { location: data.locationName, country: data.country },
        ...searchHistory.filter(h => h.location.toLowerCase() !== data.locationName.toLowerCase())
      ].slice(0, 5); // keep last 5
      
      setSearchHistory(newHistory);
      localStorage.setItem('culture_quest_history', JSON.stringify(newHistory));

      // Preset first greeting from Sora
      setChatMessages([
        {
          sender: 'assistant',
          text: `Welcome to ${data.locationName}! 🌸 I am so happy to host you. This city is famous for its cultural spirit: ${data.summary.slice(0, 150)}...\n\nFeel free to explore our topological map, view traditional crafts, or ask me for personal recommendations!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      // Set initial active map item if any
      if (data.attractions && data.attractions.length > 0) {
        setActiveItemId(data.attractions[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'We could not connect to our cultural archives. Please check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Select item on map or list
  const handleSelectItem = (id: string, type: 'attraction' | 'gem') => {
    setActiveItemId(id);
    setActiveStory(null); // Reset story for new item
    if (type === 'attraction') {
      setActiveTab('attractions');
    } else {
      setActiveTab('gems');
    }
  };

  // Handle Elder Storyteller API Request
  const handleFetchStory = async (landmarkName: string, type: string) => {
    if (!currentDiscovery) return;
    setIsLoadingStory(true);
    setActiveStory(null);

    try {
      const response = await fetch('/api/storyteller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landmarkName,
          locationName: currentDiscovery.locationName,
          itemType: type,
        })
      });

      if (!response.ok) throw new Error('Could not fetch story');
      const data = await response.json();
      setActiveStory(data);
    } catch (err: any) {
      console.error(err);
      setActiveStory({
        landmarkName,
        era: "Ancestral Past",
        narrativeText: `The elders tell of a time when the first foundations of ${landmarkName} were laid. Generation after generation, families gathered here to practice their beliefs, trade their handmade pottery, and tell stories under the starry night sky.\n\nWhile our digital connection couldn't reach the deep village archives today, the spirit of this place remains unchanged, carrying forward the living lineage of the elders who built it.`,
        folkloreOrLegend: "A single candle lit in reverence is brighter than a thousand fires lit in pride."
      });
    } finally {
      setIsLoadingStory(false);
    }
  };

  // Send Chat message to Local Guide Sora
  const handleSendChatMessage = async (text: string) => {
    if (!currentDiscovery) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setIsSendingChat(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName: currentDiscovery.locationName,
          messages: newMessages,
          userMessage: text,
        })
      });

      if (!response.ok) throw new Error('Chat failed');
      const data = await response.json();

      setChatMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: "I am sorry, traveler. My connection to our local community network is a bit weak right now, but please ask again shortly! Traditional artisans often tell us that patience is the greatest of crafts.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#F8F7F2] text-[#4A443F] font-sans selection:bg-[#EBE9E1] selection:text-[#2C2926] pb-16 transition-all duration-200 ${getAccessibilityClasses()}`} id="app-root">
      {/* Top Header */}
      <header className="border-b border-[#E5E1D8] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentDiscovery(null)}>
            <div className="p-2 bg-[#7D7C6E] text-white rounded-xl shadow-inner">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold text-[#2C2926] leading-tight">CultureQuest</h1>
              <p className="text-[10px] tracking-wider uppercase font-semibold text-[#7D7C6E] leading-none">Ethical & Immersive Heritage Explorer</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentDiscovery && (
              <button
                onClick={() => {
                  setCurrentDiscovery(null);
                  setActiveItemId(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E5E1D8] hover:border-[#7D7C6E] text-xs font-medium text-[#4A443F] bg-[#F1EFE7] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Change City
              </button>
            )}
            
            {searchHistory.length > 0 && !currentDiscovery && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-[#7D7C6E] font-medium">Recent quests:</span>
                <div className="flex gap-1.5">
                  {searchHistory.map((hist, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearch(hist.location, 'Curious cultural explorer')}
                      className="px-3 py-1 text-[11px] bg-[#F1EFE7] hover:bg-[#EBE9E1] border border-[#E5E1D8] text-[#4A443F] rounded-full transition-all cursor-pointer truncate max-w-[120px]"
                    >
                      {hist.location}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body Stage */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex gap-3 items-start animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-700" />
            <div className="flex-1">
              <h4 className="font-serif font-bold text-sm">ARCHIVE RETRIEVAL FAILURE</h4>
              <p className="text-xs text-rose-700 mt-1">{error}</p>
              <div className="flex gap-4 mt-3">
                <button 
                  onClick={() => setError(null)}
                  className="text-xs font-semibold text-rose-800 underline hover:text-[#2C2926] cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    const savedCity = searchHistory[0]?.location || 'Kyoto';
                    handleSearch(savedCity, 'Curious cultural explorer');
                  }}
                  className="text-xs font-semibold text-[#7D7C6E] flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LOADING SCREEN OVERLAY */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center space-y-6 text-center max-w-lg mx-auto" id="loading-stage">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#E5E1D8] border-t-[#7D7C6E] rounded-full animate-spin"></div>
              <Compass className="w-6 h-6 text-[#7D7C6E] absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-xl font-bold text-[#2C2926]">Unlocking Cultural Heritage Blueprint...</h2>
              <p className="text-xs text-[#4A443F] font-serif leading-relaxed max-w-sm">
                Our Generative AI model is mapping local craft preserves, translating regional folklore, auditing etiquette codes, and instructing your Virtual Local Guide.
              </p>
              <div className="text-[10px] uppercase font-bold text-[#7D7C6E] tracking-wider pt-2 animate-pulse">
                Consulting global heritage databases
              </div>
            </div>
          </div>
        )}

        {/* 1. PORTAL LANDING (Default state when no discovery is loaded) */}
        {!currentDiscovery && !isLoading && (
          <CultureQuestWelcome
            onSelectPreset={handleSearch}
            onSearchSubmit={handleSearch}
            isLoading={isLoading}
          />
        )}

        {/* 2. LIVE CULTURAL DASHBOARD */}
        {currentDiscovery && !isLoading && (
          <div className="space-y-6 animate-fade-in" id="dashboard-stage">
            
            {/* Destination Billboard Banner */}
            <div className="bg-white border border-[#E5E1D8] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 card-shadow relative overflow-hidden">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7D7C6E] uppercase tracking-wider">
                    <MapPin className="w-4 h-4 text-[#7D7C6E]" />
                    {currentDiscovery.country}
                  </div>
                  {ttsSpeechEnabled && (
                    <button
                      onClick={() => handleToggleSpeak(`${currentDiscovery.locationName}. ${currentDiscovery.summary}`, 'billboard')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                        currentlySpeaking === 'billboard'
                          ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                          : 'bg-[#F1EFE7] border-[#E5E1D8] text-[#7D7C6E] hover:bg-[#EBE9E1]'
                      }`}
                      aria-label="Read description out loud"
                    >
                      {currentlySpeaking === 'billboard' ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-rose-600 animate-pulse" /> Stop Voice
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-[#7D7C6E]" /> Listen Voice
                        </>
                      )}
                    </button>
                  )}
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2C2926]">
                  {currentDiscovery.locationName}
                </h2>
                <p className="text-[#4A443F] font-serif text-sm sm:text-base leading-relaxed">
                  {currentDiscovery.summary}
                </p>
              </div>
              <div className="shrink-0 flex gap-2">
                <span className="text-[10px] bg-[#7D7C6E] text-white px-3 py-1.5 rounded-full font-sans font-bold tracking-wider uppercase">
                  Community Verified
                </span>
              </div>
            </div>

            {/* Core Bento Grid: Map, Virtual Host, details panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Interactive Map Map HUD */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
                
                {/* 2D Interactive SVG Map container */}
                <div className="h-[480px]">
                  <InteractiveMap
                    locationName={currentDiscovery.locationName}
                    attractions={currentDiscovery.attractions}
                    hiddenGems={currentDiscovery.hiddenGems}
                    activeItemId={activeItemId}
                    onSelectItem={handleSelectItem}
                  />
                </div>

                {/* Structured details pane (Tabs) */}
                <div className="bg-white rounded-2xl border border-[#E5E1D8] p-6 card-shadow">
                  {/* Tab list header */}
                  <div className="flex border-b border-[#E5E1D8] overflow-x-auto pb-px [scrollbar-width:none]">
                    <button
                      onClick={() => setActiveTab('attractions')}
                      className={`py-3 px-4 font-serif text-sm font-semibold border-b-2 transition-all shrink-0 cursor-pointer ${
                        activeTab === 'attractions'
                          ? 'border-[#7D7C6E] text-[#7D7C6E] font-bold'
                          : 'border-transparent text-[#4A443F]/60 hover:text-[#2C2926]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Landmark className="w-4 h-4" />
                        Heritage Landmarks
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab('gems')}
                      className={`py-3 px-4 font-serif text-sm font-semibold border-b-2 transition-all shrink-0 cursor-pointer ${
                        activeTab === 'gems'
                          ? 'border-[#7D7C6E] text-[#7D7C6E] font-bold'
                          : 'border-transparent text-[#4A443F]/60 hover:text-[#2C2926]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4" />
                        Hidden Gems
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab('events')}
                      className={`py-3 px-4 font-serif text-sm font-semibold border-b-2 transition-all shrink-0 cursor-pointer ${
                        activeTab === 'events'
                          ? 'border-[#7D7C6E] text-[#7D7C6E] font-bold'
                          : 'border-transparent text-[#4A443F]/60 hover:text-[#2C2926]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Local Events
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab('story')}
                      className={`py-3 px-4 font-serif text-sm font-semibold border-b-2 transition-all shrink-0 cursor-pointer ${
                        activeTab === 'story'
                          ? 'border-[#7D7C6E] text-[#7D7C6E] font-bold'
                          : 'border-transparent text-[#4A443F]/60 hover:text-[#2C2926]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" />
                        Oral Histories
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab('mindful')}
                      className={`py-3 px-4 font-serif text-sm font-semibold border-b-2 transition-all shrink-0 cursor-pointer ${
                        activeTab === 'mindful'
                          ? 'border-[#7D7C6E] text-[#7D7C6E] font-bold'
                          : 'border-transparent text-[#4A443F]/60 hover:text-[#2C2926]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Heart className="w-4 h-4" />
                        Mindful Codes & Crafts
                      </span>
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="pt-6">
                    {/* Attractions Tab */}
                    {activeTab === 'attractions' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {currentDiscovery.attractions.map((attr) => (
                            <div
                              key={attr.id}
                              onClick={() => setActiveItemId(attr.id)}
                              className={`rounded-xl border transition-all cursor-pointer overflow-hidden flex flex-col h-full bg-white ${
                                activeItemId === attr.id
                                  ? 'border-[#7D7C6E] ring-2 ring-[#7D7C6E]/20 card-shadow'
                                  : 'border-[#E5E1D8] hover:border-[#7D7C6E]/50 hover:shadow-sm'
                              }`}
                            >
                              {/* Attraction Image Banner */}
                              <div className="h-44 w-full overflow-hidden relative bg-[#EBE9E1] shrink-0">
                                <img
                                  src={getAttractionImage(attr.imageUrl, attr.type)}
                                  alt={attr.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                />
                                <div className="absolute top-3 right-3">
                                  <span className="text-[10px] bg-white/95 backdrop-blur-xs text-[#7D7C6E] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider shadow-xs shrink-0 border border-[#E5E1D8]">
                                    {attr.type}
                                  </span>
                                </div>
                              </div>

                              <div className="p-4 flex flex-col flex-1">
                                <div className="flex justify-between items-center gap-2">
                                  <h4 className="font-serif font-bold text-[#2C2926] text-sm leading-tight">{attr.name}</h4>
                                  {ttsSpeechEnabled && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleSpeak(`${attr.name}. ${attr.description}. Historical significance: ${attr.significance}. Respectful tip: ${attr.practicalTip}`, `attr-${attr.id}`);
                                      }}
                                      className={`p-1.5 rounded-full border transition-all duration-150 shrink-0 cursor-pointer ${
                                        currentlySpeaking === `attr-${attr.id}`
                                          ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                                          : 'bg-[#F1EFE7] border-[#E5E1D8] text-[#7D7C6E] hover:bg-[#EBE9E1]'
                                      }`}
                                      aria-label={`Listen to details of ${attr.name}`}
                                    >
                                      {currentlySpeaking === `attr-${attr.id}` ? (
                                        <VolumeX className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                                      ) : (
                                        <Volume2 className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-[#4A443F] font-serif leading-relaxed mt-2 flex-1">
                                  {attr.description}
                                </p>
                                
                                <div className="mt-4 space-y-2 border-t border-[#E5E1D8] pt-3">
                                  <p className="text-[11px] text-[#4A443F]">
                                    <strong className="text-[#7D7C6E] font-semibold">Historical Significance: </strong>
                                    {attr.significance}
                                  </p>
                                  <p className="text-[11px] text-[#4A443F] bg-[#F8F7F2]/80 p-2.5 rounded-lg border border-[#E5E1D8] italic">
                                    <strong className="text-[#2C2926] not-italic font-sans font-semibold">Respectful tip: </strong>
                                    {attr.practicalTip}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hidden Gems Tab */}
                    {activeTab === 'gems' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {currentDiscovery.hiddenGems.map((gem) => (
                            <div
                              key={gem.id}
                              onClick={() => setActiveItemId(gem.id)}
                              className={`rounded-xl border transition-all cursor-pointer overflow-hidden flex flex-col h-full bg-white ${
                                activeItemId === gem.id
                                  ? 'border-[#7D7C6E] ring-2 ring-[#7D7C6E]/20 card-shadow'
                                  : 'border-[#E5E1D8] hover:border-[#7D7C6E]/50 hover:shadow-sm'
                              }`}
                            >
                              {/* Hidden Gem Image Banner */}
                              <div className="h-44 w-full overflow-hidden relative bg-[#EBE9E1] shrink-0">
                                <img
                                  src={getAttractionImage(gem.imageUrl, 'craft')}
                                  alt={gem.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                />
                                <div className="absolute top-3 right-3">
                                  <span className="text-[10px] bg-[#2C2926]/90 text-white px-2.5 py-1 rounded-md font-bold uppercase tracking-wider shadow-xs shrink-0">
                                    Hidden Gem
                                  </span>
                                </div>
                              </div>

                              <div className="p-4 flex flex-col flex-1">
                                <div className="flex justify-between items-center gap-2">
                                  <h4 className="font-serif font-bold text-[#2C2926] text-sm leading-tight">{gem.name}</h4>
                                  {ttsSpeechEnabled && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleSpeak(`${gem.name}. ${gem.description}. Local secret: ${gem.localSecret}. How to find respectfully: ${gem.howToFind}`, `gem-${gem.id}`);
                                      }}
                                      className={`p-1.5 rounded-full border transition-all duration-150 shrink-0 cursor-pointer ${
                                        currentlySpeaking === `gem-${gem.id}`
                                          ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                                          : 'bg-[#F1EFE7] border-[#E5E1D8] text-[#7D7C6E] hover:bg-[#EBE9E1]'
                                      }`}
                                      aria-label={`Listen to details of ${gem.name}`}
                                    >
                                      {currentlySpeaking === `gem-${gem.id}` ? (
                                        <VolumeX className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                                      ) : (
                                        <Volume2 className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-[#4A443F] font-serif leading-relaxed mt-2 flex-1">
                                  {gem.description}
                                </p>

                                <div className="mt-4 space-y-2 border-t border-[#E5E1D8] pt-3">
                                  <p className="text-[11px] text-[#4A443F]">
                                    <strong className="text-[#7D7C6E] font-semibold">Local Secret: </strong>
                                    {gem.localSecret}
                                  </p>
                                  <p className="text-[11px] text-[#4A443F]">
                                    <strong className="text-[#2C2926] font-sans font-semibold">Direct Local Impact: </strong>
                                    <span className="text-[#4A443F]">{gem.communityImpact}</span>
                                  </p>
                                  <p className="text-[11px] text-[#4A443F] bg-[#F8F7F2]/80 p-2.5 rounded-lg border border-[#E5E1D8] italic">
                                    <strong className="font-sans font-semibold not-italic text-[#2C2926]">How to find respectfully: </strong>
                                    {gem.howToFind}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Local Events Tab */}
                    {activeTab === 'events' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentDiscovery.localEvents.map((event) => (
                            <div
                              key={event.id}
                              className="p-4 rounded-xl border border-[#E5E1D8] bg-white card-shadow"
                            >
                              <div className="flex justify-between items-start gap-2 border-b border-[#E5E1D8] pb-2">
                                <div>
                                  <h4 className="font-serif font-bold text-[#2C2926] text-sm leading-tight">{event.name}</h4>
                                  <p className="text-[10px] text-[#7D7C6E] font-semibold uppercase mt-0.5 tracking-wider">Occurs: {event.season}</p>
                                </div>
                                <span className="text-[9px] bg-[#F1EFE7] text-[#7D7C6E] px-2.5 py-0.5 rounded font-bold uppercase shrink-0">
                                  Festival / Event
                                </span>
                              </div>
                              
                              <p className="text-xs text-[#4A443F] font-serif leading-relaxed mt-3">
                                {event.description}
                              </p>

                              <div className="mt-3.5 space-y-2 bg-[#F1EFE7]/30 p-2.5 rounded-lg border border-[#E5E1D8]">
                                <p className="text-[11px] text-[#4A443F]">
                                  <strong className="text-[#7D7C6E] font-semibold">Cultural Symbolism: </strong>
                                  <span className="font-serif italic">{event.culturalImportance}</span>
                                </p>
                                <p className="text-[11px] text-[#4A443F]">
                                  <strong className="text-[#2C2926] font-semibold font-sans">How to Attend Respectfully: </strong>
                                  {event.visitorParticipationTip}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Storytelling Tab */}
                    {activeTab === 'story' && (
                      <StorytellingSection
                        locationName={currentDiscovery.locationName}
                        activeItemName={activeItemName}
                        activeItemType={activeItemType}
                        activeStory={activeStory}
                        onFetchStory={handleFetchStory}
                        isLoadingStory={isLoadingStory}
                      />
                    )}

                    {/* Mindful Tab */}
                    {activeTab === 'mindful' && (
                      <EtiquetteGuides
                        etiquetteGuides={currentDiscovery.etiquetteGuides}
                        traditionalCrafts={currentDiscovery.traditionalCrafts}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Virtual Host Chat Guide */}
              <div className="lg:col-span-5 xl:col-span-4 h-full min-h-[500px]">
                <VirtualGuideChat
                  locationName={currentDiscovery.locationName}
                  messages={chatMessages}
                  onSendMessage={handleSendChatMessage}
                  isSending={isSendingChat}
                />
              </div>

            </div>
          </div>
        )}
      </main>

      {/* PERSISTENT ACCESSIBILITY FLOATING PANEL */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans print:hidden">
        {/* Toggle Panel */}
        {isAccessibilityMenuOpen && (
          <div 
            className="w-80 bg-white border-2 border-[#7D7C6E] rounded-2xl p-5 shadow-2xl animate-fade-in text-[#2C2926] space-y-4"
            id="accessibility-control-panel"
            role="dialog"
            aria-label="Accessibility Settings"
          >
            <div className="flex justify-between items-center border-b border-[#E5E1D8] pb-3">
              <h3 className="font-serif font-bold text-sm flex items-center gap-2">
                <Accessibility className="w-4 h-4 text-[#7D7C6E]" />
                Accessibility Menu
              </h3>
              <button 
                onClick={() => setIsAccessibilityMenuOpen(false)}
                className="text-stone-400 hover:text-[#2C2926] text-[10px] font-bold px-2 py-1 rounded border border-[#E5E1D8] hover:bg-[#F1EFE7] cursor-pointer"
                aria-label="Close Accessibility Settings"
              >
                Close
              </button>
            </div>

            {/* Font Size controls */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#7D7C6E] block uppercase tracking-wider">
                Font Sizing
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setFontSize('normal')}
                  className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    fontSize === 'normal' 
                      ? 'border-[#7D7C6E] bg-[#7D7C6E] text-white' 
                      : 'border-[#E5E1D8] bg-[#F8F7F2] hover:bg-[#F1EFE7]'
                  }`}
                  aria-pressed={fontSize === 'normal'}
                >
                  Standard (100%)
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    fontSize === 'large' 
                      ? 'border-[#7D7C6E] bg-[#7D7C6E] text-white' 
                      : 'border-[#E5E1D8] bg-[#F8F7F2] hover:bg-[#F1EFE7]'
                  }`}
                  aria-pressed={fontSize === 'large'}
                >
                  Large (115%)
                </button>
                <button
                  onClick={() => setFontSize('huge')}
                  className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    fontSize === 'huge' 
                      ? 'border-[#7D7C6E] bg-[#7D7C6E] text-white' 
                      : 'border-[#E5E1D8] bg-[#F8F7F2] hover:bg-[#F1EFE7]'
                  }`}
                  aria-pressed={fontSize === 'huge'}
                >
                  Huge (130%)
                </button>
              </div>
            </div>

            {/* Dyslexia / Readability Font toggle */}
            <div className="flex items-center justify-between border-t border-[#E5E1D8]/60 pt-3">
              <div>
                <span className="text-xs font-bold text-[#2C2926] block">High Readability Font</span>
                <span className="text-[9px] text-[#7D7C6E] block">Sans-serif & spacious layouts</span>
              </div>
              <button
                onClick={() => setReadabilityFont(!readabilityFont)}
                className={`w-12 h-6 rounded-full p-0.5 transition-all relative ${
                  readabilityFont ? 'bg-[#7D7C6E]' : 'bg-stone-300'
                }`}
                aria-label="Toggle High Readability Font"
                aria-pressed={readabilityFont}
              >
                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-all ${
                  readabilityFont ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Enhanced contrast mode toggle */}
            <div className="flex items-center justify-between border-t border-[#E5E1D8]/60 pt-3">
              <div>
                <span className="text-xs font-bold text-[#2C2926] block">Enhanced Contrast Mode</span>
                <span className="text-[9px] text-[#7D7C6E] block">High readability WCAG AAA ink</span>
              </div>
              <button
                onClick={() => setHighContrast(!highContrast)}
                className={`w-12 h-6 rounded-full p-0.5 transition-all relative ${
                  highContrast ? 'bg-[#7D7C6E]' : 'bg-stone-300'
                }`}
                aria-label="Toggle Enhanced Contrast"
                aria-pressed={highContrast}
              >
                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-all ${
                  highContrast ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Audio Speech Guide */}
            <div className="flex items-center justify-between border-t border-[#E5E1D8]/60 pt-3">
              <div>
                <span className="text-xs font-bold text-[#2C2926] block">Read-Aloud Voice Guides</span>
                <span className="text-[9px] text-[#7D7C6E] block">TTS voice cues on card headers</span>
              </div>
              <button
                onClick={() => {
                  setTtsSpeechEnabled(!ttsSpeechEnabled);
                  if (ttsSpeechEnabled) {
                    window.speechSynthesis?.cancel();
                    setCurrentlySpeaking(null);
                  }
                }}
                className={`w-12 h-6 rounded-full p-0.5 transition-all relative ${
                  ttsSpeechEnabled ? 'bg-[#7D7C6E]' : 'bg-stone-300'
                }`}
                aria-label="Toggle Interactive Voice"
                aria-pressed={ttsSpeechEnabled}
              >
                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-all ${
                  ttsSpeechEnabled ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {currentlySpeaking && (
              <div className="bg-[#F1EFE7] p-2.5 rounded-lg border border-[#E5E1D8] flex items-center justify-between">
                <span className="text-[10px] text-[#4A443F] font-semibold animate-pulse flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-[#7D7C6E]" />
                  Narrating details...
                </span>
                <button
                  onClick={() => {
                    window.speechSynthesis?.cancel();
                    setCurrentlySpeaking(null);
                  }}
                  className="text-[10px] text-rose-700 bg-white border border-rose-150 px-2 py-0.5 rounded hover:bg-rose-50 font-bold cursor-pointer"
                >
                  Mute
                </button>
              </div>
            )}
          </div>
        )}

        {/* Floating circular activation button */}
        <button
          onClick={() => setIsAccessibilityMenuOpen(!isAccessibilityMenuOpen)}
          className={`p-3.5 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 transform active:scale-95 border-2 cursor-pointer focus:ring-4 focus:ring-[#7D7C6E]/30 ${
            isAccessibilityMenuOpen 
              ? 'bg-[#2C2926] text-white border-[#2C2926]' 
              : 'bg-white text-[#7D7C6E] hover:text-[#2C2926] border-[#7D7C6E]'
          }`}
          aria-label="Open Accessibility Menu"
          aria-expanded={isAccessibilityMenuOpen}
        >
          <Accessibility className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
