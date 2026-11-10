import { ApiError } from '../api/client.ts';
import { draftFromEntry } from './model.ts';
import type { ChatRequest, ChatResponse, EntryDraft, ResolvedEntry } from './types.ts';

type Message = { id: number; role: 'user' | 'assistant'; text: string };
type Conversation = {
  messages: Message[];
  draft: EntryDraft | null;
  proposal: ChatResponse | null;
  failure: ApiError | null;
  failedRequest: ChatRequest | null;
  reviewRequired: boolean;
  saveState: 'ready' | 'uncertain' | 'saved';
};

type Action =
  | { type: 'send'; request: ChatRequest; append: boolean }
  | { type: 'reply'; response: ChatResponse; text: string }
  | { type: 'parseFailed'; request: ChatRequest; error: ApiError }
  | { type: 'edit'; entry: ResolvedEntry }
  | { type: 'save' }
  | { type: 'saved' }
  | { type: 'saveFailed'; error: ApiError }
  | { type: 'reset' };

export function newConversation(): Conversation {
  return { messages: [], draft: null, proposal: null, failure: null, failedRequest: null, reviewRequired: false, saveState: 'ready' };
}

function appendMessage(messages: Message[], message: Omit<Message, 'id'>): Message[] {
  return [...messages.slice(-19), { ...message, id: (messages.at(-1)?.id ?? 0) + 1 }];
}

export function conversationReducer(state: Conversation, action: Action): Conversation {
  switch (action.type) {
    case 'send':
      return { ...state, failure: null, messages: action.append ? appendMessage(state.messages, { role: 'user', text: action.request.text }) : state.messages };
    case 'reply': {
      const result = action.response.result;
      return {
        ...state,
        messages: appendMessage(state.messages, { role: 'assistant', text: action.text }),
        draft: result.kind === 'proposal' ? result.draft : state.draft,
        proposal: result.kind === 'proposal' ? action.response : state.proposal,
        saveState: result.kind === 'proposal' ? 'ready' : state.saveState,
        reviewRequired: result.kind === 'proposal' ? false : state.reviewRequired || (result.kind !== 'question' && state.saveState === 'ready' && Boolean(state.proposal?.entry)),
        failedRequest: result.kind === 'proposal' ? null : state.failedRequest,
      };
    }
    case 'parseFailed':
      return { ...state, failure: action.error, failedRequest: action.request };
    case 'edit': {
      if (!state.proposal || state.saveState !== 'ready') return state;
      const draft = draftFromEntry(action.entry);
      return { ...state, draft, proposal: { ...state.proposal, entry: action.entry, result: { kind: 'proposal', draft, missing: [] }, needs: [] }, failure: null, failedRequest: null, reviewRequired: false };
    }
    case 'save':
      return { ...state, failure: null };
    case 'saved':
      return { ...state, saveState: 'saved', draft: null, failure: null };
    case 'saveFailed':
      return { ...state, failure: action.error, saveState: ['validation', 'conflict', 'notFound'].includes(action.error.kind) ? 'ready' : 'uncertain' };
    case 'reset':
      return newConversation();
  }
}

export function canConfirm(state: Conversation): boolean {
  return Boolean(state.proposal?.entry && state.proposal.proposal_id && !state.failedRequest && !state.reviewRequired && state.saveState !== 'saved');
}
