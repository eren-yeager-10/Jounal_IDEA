export type ReflectionMode = 'reflect' | 'summarize' | 'brainstorm' | 'chat';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  mode?: ReflectionMode;
}

export interface CartographyMetadata {
  themes: string[];
  people: string[];
  sentiment: number; // -1 to 1
  recurring_flag: boolean;
  analyzedAt?: number;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  messages: ChatMessage[];
  cartography?: CartographyMetadata;
  createdAt: number;
  updatedAt: number;
}

export interface FutureLetter {
  id: string;
  userId: string;
  deliveryDate: string; // YYYY-MM-DD
  delivered: boolean;
  teaser: string;
  content: string;
  fromEntryTitle?: string;
  createdAt: number;
  deliveredAt?: number;
}

export interface SharedLetter {
  id: string;
  teaser: string;
  content: string;
  opened: boolean;
  openedAt?: number | null;
  createdAt: number;
}

export interface ReflectionRequest {
  prompt: string;
  entryContent?: string;
  entryTitle?: string;
  history?: Array<{
    role: 'user' | 'model';
    content: string;
  }>;
  mode?: ReflectionMode;
}

export interface ReflectionResponse {
  text: string;
  mode: ReflectionMode;
  modelUsed: string;
  summary?: string;
}

export interface CartographyRequest {
  entryTitle: string;
  entryContent: string;
  recentEntriesSummary?: string;
}

export interface FutureLetterDraftRequest {
  entryTitle: string;
  entryContent: string;
  deliveryDate: string;
  recentThemes?: string[];
}

export interface CreateSharedLetterRequest {
  entryTitle: string;
  entryContent: string;
  customTeaser?: string;
  customContent?: string;
}

