import React, { useState, useRef, useEffect } from 'react';
import { Send, User, MessageCircle, HelpCircle, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';

interface VirtualGuideChatProps {
  locationName: string;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isSending: boolean;
}

export default function VirtualGuideChat({
  locationName,
  messages,
  onSendMessage,
  isSending,
}: VirtualGuideChatProps) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Suggested questions based on location
  const suggestions = [
    `Tell me about the best family-owned food stalls in ${locationName}.`,
    `How can I respectfully support traditional artisans here?`,
    `Are there any local customs I should be extra careful about?`,
    `What are the most tranquil, low-crowd hours to explore?`
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;
    const text = inputText;
    setInputText('');
    onSendMessage(text);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isSending) return;
    onSendMessage(suggestion);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  return (
    <div className="flex flex-col h-full bg-[#F1EFE7] rounded-2xl border border-[#E5E1D8] card-shadow overflow-hidden" id="virtual-guide-chat">
      {/* Header Info */}
      <div className="bg-[#7D7C6E] text-white p-4 flex items-center gap-3 border-b border-[#E5E1D8]">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-[#2C2926] flex items-center justify-center font-serif font-bold text-lg text-white shadow-md border border-[#E5E1D8]">
            S
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#7D7C6E]"></span>
        </div>
        <div>
          <h4 className="font-serif font-medium text-white flex items-center gap-1.5 leading-snug">
            Sora
            <span className="text-[10px] bg-[#F1EFE7] text-[#7D7C6E] px-1.5 py-0.5 rounded tracking-wide font-sans font-semibold uppercase">
              Local Host
            </span>
          </h4>
          <p className="text-xs text-[#F1EFE7]/90 leading-none mt-1">Cultural preservationist & your guide to {locationName}</p>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[380px] min-h-[250px] bg-[#F8F7F2] [scrollbar-width:thin]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <MessageCircle className="w-10 h-10 text-[#7D7C6E]/40 stroke-1" />
            <div>
              <p className="font-serif text-[#2C2926] font-semibold">Greetings from {locationName}!</p>
              <p className="text-xs text-[#4A443F] max-w-xs mt-1 leading-relaxed">
                I am Sora, a lifelong local here. Ask me anything about our traditions, artisan crafts, hidden neighborhood spots, or respectful visiting codes.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={index}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-[#7D7C6E] flex items-center justify-center text-white shrink-0 font-serif font-bold text-xs">
                    S
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-[#2C2926] text-[#F8F7F2] rounded-tr-none font-sans'
                      : 'bg-white text-[#4A443F] border border-[#E5E1D8] rounded-tl-none font-serif'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span className="block text-[9px] text-[#4A443F]/60 mt-1 text-right">
                    {msg.timestamp}
                  </span>
                </div>
                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-[#7D7C6E]/25 flex items-center justify-center text-[#7D7C6E] shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Sending/Typing state indicator */}
        {isSending && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-8 h-8 rounded-full bg-[#7D7C6E] flex items-center justify-center text-white shrink-0 font-serif font-bold text-xs">
              S
            </div>
            <div className="bg-white text-[#4A443F] border border-[#E5E1D8] rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-[#7D7C6E]" />
              <span className="text-xs italic font-serif text-[#4A443F]">Sora is looking up local notes...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestion list */}
      {messages.length === 0 && (
        <div className="px-4 py-3 bg-[#F1EFE7]/80 border-t border-[#E5E1D8]">
          <p className="text-[10px] font-sans font-semibold text-[#7D7C6E] uppercase tracking-wider mb-2 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-[#7D7C6E]" />
            Suggested Questions:
          </p>
          <div className="flex flex-col gap-1.5">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-left text-xs bg-white hover:bg-[#F8F7F2] text-[#4A443F] py-1.5 px-3 rounded-full border border-[#E5E1D8] transition-colors leading-normal cursor-pointer hover:border-[#7D7C6E] hover:text-[#2C2926]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Send Message Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#E5E1D8] bg-white flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Speak with Sora about ${locationName}...`}
          disabled={isSending}
          className="flex-1 px-3 py-2 rounded-lg border border-[#E5E1D8] text-sm bg-[#F8F7F2]/40 text-[#4A443F] placeholder-[#4A443F]/50 focus:outline-none focus:border-[#7D7C6E] focus:bg-white text-ellipsis"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="bg-[#7D7C6E] hover:bg-[#7D7C6E]/90 disabled:bg-[#EBE9E1] text-white disabled:text-[#4A443F]/40 px-3.5 py-2 rounded-full transition-colors cursor-pointer flex items-center justify-center shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
