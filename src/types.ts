/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Attraction {
  id: string;
  name: string;
  type: 'heritage' | 'nature' | 'art' | 'culinary' | 'craft';
  description: string;
  significance: string;
  practicalTip: string;
  latitudeOffset: number; // For plotting on interactive SVG map (-100 to 100)
  longitudeOffset: number; // For plotting on interactive SVG map (-100 to 100)
  imageUrl?: string;
}

export interface HiddenGem {
  id: string;
  name: string;
  description: string;
  howToFind: string;
  localSecret: string;
  communityImpact: string; // How visiting supports the local community
  latitudeOffset: number;
  longitudeOffset: number;
  imageUrl?: string;
}

export interface LocalEvent {
  id: string;
  name: string;
  season: string;
  description: string;
  culturalImportance: string;
  visitorParticipationTip: string;
}

export interface TraditionalCraft {
  name: string;
  artisanType: string;
  description: string;
  whereToWitness: string;
  preservationStatus: string; // e.g., "Endangered", "Vibrant"
}

export interface CulturalEtiquette {
  rule: string;
  explanation: string;
  commonMistake: string;
  respectfulAlternative: string;
}

export interface ImmersiveStory {
  landmarkName: string;
  era: string;
  narrativeText: string;
  folkloreOrLegend: string;
}

export interface DiscoveryResponse {
  locationName: string;
  country: string;
  summary: string;
  attractions: Attraction[];
  hiddenGems: HiddenGem[];
  localEvents: LocalEvent[];
  traditionalCrafts: TraditionalCraft[];
  etiquetteGuides: CulturalEtiquette[];
}

export interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
