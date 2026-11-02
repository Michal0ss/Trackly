import Feather from '@expo/vector-icons/Feather';
import { router, useFocusEffect, useIsFocused } from 'expo-router';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, View, type TextInputInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { ChatComposer } from '@/chat/ChatComposer';
import { ChatViewport, type ChatViewportHandle } from '@/chat/ChatViewport';
import { EntryEditor } from '@/chat/EntryEditor';
import { canConfirm, conversationReducer, newConversation } from '@/chat/conversation';
import { chatReply, createConfirmation } from '@/chat/model';
import { createParsingTask } from '@/chat/parsing';
import type { ChatRequest, ResolvedEntry } from '@/chat/types';
import { AppText, BrandHeader, IconTile, Notice, Screen, ScreenTitle, sharedStyles } from '@/components/ui';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Action, categoryLabel, ConnectionState, errorText, intervalLabel } from '@/payments/components';
import { usePayments } from '@/payments/PaymentsProvider';
import { categoryIcon, formatDueDate, formatMoney, localDate } from '@/payments/model';
import { colors, fonts } from '@/theme/theme';

function LocalChat({ input, setInput }: { input: string; setInput: (value: string) => void }) {
  const { copy, language } = useLanguage();
  const { connected, parseChat, confirmChat } = usePayments();
  const [conversation, dispatch] = useReducer(conversationReducer, undefined, newConversation);
  const { messages, draft, proposal: response, failure, failedRequest, reviewRequired, saveState } = conversation;
  const focused = useIsFocused();
  const [busy, setBusy] = useState<'parse' | 'save' | null>(null);
  const [editing, setEditing] = useState(false);
  const pending = useRef(false);
  const [parsing] = useState(createParsingTask);
  const confirmation = useRef<ReturnType<typeof createConfirmation> | null>(null);
  const viewport = useRef<ChatViewportHandle>(null);
  const inputRef = useRef<TextInputInstance>(null);

  useEffect(() => () => parsing.dispose(), [parsing]);
  useFocusEffect(useCallback(() => () => { inputRef.current?.blur(); }, []));
  function run(request: ChatRequest, append: boolean) {
    if (pending.current || !connected || saveState === 'uncertain') return;
    pending.current = true;
    setBusy('parse');
    dispatch({ type: 'send', request, append });
    confirmation.current = null;
    if (append) { viewport.current?.revealLatest(); setInput(''); }
    parsing.run(request, parseChat, {
      reply: result => dispatch({ type: 'reply', response: result, text: chatReply(result, copy, language) }),
      failed: error => dispatch({ type: 'parseFailed', error, request }),
      settled: () => { pending.current = false; setBusy(null); },
    });
  }

  function send() {
    const text = input.trim();
    if (!text) return;
    run({ text, language, today: localDate(), default_currency: draft?.currency ?? (language === 'pl' ? 'PLN' : 'USD'), context: messages.filter(item => item.role === 'user').slice(-6).map(item => item.text), draft }, true);
  }

  async function save() {
    if (pending.current || !canConfirm(conversation) || !response?.entry || !response.proposal_id) return;
    confirmation.current ??= createConfirmation({ proposal_id: response.proposal_id, entry: response.entry }, confirmChat);
    pending.current = true; setBusy('save'); dispatch({ type: 'save' });
    try {
      await confirmation.current();
      dispatch({ type: 'saved' });
    } catch (cause) {
      const error = cause instanceof ApiError ? cause : new ApiError('server');
      if (['validation', 'conflict', 'notFound'].includes(error.kind)) {
        confirmation.current = null;
      }
      dispatch({ type: 'saveFailed', error });
    } finally { pending.current = false; setBusy(null); }
  }

  function reset() {
    if (pending.current || saveState === 'uncertain') return;
    dispatch({ type: 'reset' }); setInput('');
    confirmation.current = null;
    viewport.current?.reset();
    inputRef.current?.focus();
  }

  function apply(entry: ResolvedEntry) {
    dispatch({ type: 'edit', entry }); setEditing(false);
  }

  const locked = Boolean(busy) || saveState === 'uncertain';
  const entry = response?.entry;
  const examples = language === 'pl'
    ? ['Czynsz 2400 zł', 'Netflix 49 zł co miesiąc', 'Ile płacę miesięcznie?', 'Kiedy mam najbliższą płatność?']
    : ['Paid $1,850 for rent today', 'Netflix $15.49 a month', 'How much do I pay this month?'];

  return <SafeAreaView style={styles.page} edges={['top', 'left', 'right']}>
    {messages.length > 0 && <View style={styles.toolbar}>
      <AppText accessibilityRole="header" style={sharedStyles.sectionTitle}>{copy.chatTab}</AppText>
      <Pressable accessibilityRole="button" accessibilityLabel={copy.chatReset} accessibilityState={{ disabled: locked }} disabled={locked} onPress={reset}
        style={({ pressed }) => [styles.reset, (pressed || locked) && styles.dimmed]}>
        <Feather name="edit-3" size={19} color={colors.greenSoft} /><AppText style={styles.resetText}>{copy.chatReset}</AppText>
      </Pressable>
    </View>}
    <ChatViewport ref={viewport} revision={conversation} hasMessages={messages.length > 0} active={focused && !editing}
      composer={<ChatComposer value={input} onChange={setInput} onSend={send} onCancel={busy === 'parse' ? parsing.cancel : undefined} busy={Boolean(busy)} locked={saveState === 'uncertain'} inputRef={inputRef} />}>
        <View style={styles.content}>
          {messages.length === 0 && <><BrandHeader /><ScreenTitle title={copy.chatTitle} subtitle={copy.chatSubtitle} /></>}
          <Notice>{copy.chatTestNotice}</Notice>
          {messages.length === 0 ? <View style={styles.examples}>
            <AppText style={sharedStyles.sectionTitle}>{copy.chatTryExample}</AppText>
            {examples.map(text => <Pressable key={text} accessibilityRole="button" accessibilityLabel={text} onPress={() => { setInput(text); inputRef.current?.focus(); }} style={styles.example}><AppText style={styles.exampleText}>{text}</AppText><Feather name="arrow-down-left" size={18} color={colors.greenSoft} /></Pressable>)}
          </View> : null}
          {messages.map(message => <View key={message.id} style={[styles.bubble, message.role === 'user' ? styles.user : styles.assistant]}>
            <AppText style={message.role === 'user' ? styles.userText : undefined}>{message.text}</AppText>
          </View>)}
          {busy === 'parse' && <View style={styles.progress} accessibilityRole="progressbar" accessibilityLabel={copy.chatThinking}><ActivityIndicator color={colors.greenSoft} /><AppText>{copy.chatThinking}</AppText></View>}
          {entry && <View style={sharedStyles.card}>
            <View style={styles.cardTitle}><IconTile name={categoryIcon(entry.category)} /><View style={styles.cardName}><AppText style={sharedStyles.cardTitle}>{entry.name}</AppText><AppText style={styles.muted}>{entry.plan_name || categoryLabel(entry.category, copy)}</AppText></View></View>
            <AppText style={styles.amount}>{formatMoney(entry.amount, entry.currency, language)}</AppText>
            <AppText>{intervalLabel(entry.interval_months, copy)}</AppText>
            <AppText>{copy.startLabel}: {formatDueDate(entry.start_date, language)}</AppText>
            {entry.end_date && <AppText>{copy.endsOn}: {formatDueDate(entry.end_date, language)}</AppText>}
            {entry.note && <AppText>{entry.note}</AppText>}
            {saveState === 'saved' ? <>
              <AppText style={styles.saved} accessibilityLiveRegion="polite">{copy.chatSaved}</AppText>
              <Action label={copy.backHome} secondary onPress={() => router.navigate('/')} />
            </> : <>
              {saveState === 'uncertain' && <AppText>{copy.chatUncertain}</AppText>}
              {(failedRequest || reviewRequired) && <AppText>{copy.chatCorrectionRequired}</AppText>}
              <Action label={busy === 'save' ? copy.saving : saveState === 'uncertain' ? copy.chatRetrySave : copy.save} disabled={Boolean(busy) || !canConfirm(conversation)} onPress={() => void save()} />
              <Action label={copy.chatChange} secondary disabled={locked} onPress={() => { Keyboard.dismiss(); setEditing(true); }} />
            </>}
          </View>}
          {failure && <View style={styles.failure} accessibilityLiveRegion="polite">
            <AppText style={failure.kind === 'cancelled' ? styles.muted : styles.error}>{failure.kind === 'cancelled' ? copy.chatCancelled : failure.kind === 'unavailable' ? copy.chatUnavailableError : failure.kind === 'validation' ? copy.chatValidationError : errorText(failure, copy)}</AppText>
            {failedRequest && <Action label={copy.retry} secondary disabled={Boolean(busy)} onPress={() => run(failedRequest, false)} />}
          </View>}
        </View>
    </ChatViewport>
    {editing && entry && <EntryEditor entry={entry} onApply={apply} onCancel={() => setEditing(false)} />}
  </SafeAreaView>;
}

export default function ChatScreen() {
  const { copy } = useLanguage();
  const { connected } = usePayments();
  const [input, setInput] = useState('');
  if (!__DEV__) return <Screen><BrandHeader /><ScreenTitle title={copy.chatTitle} subtitle={copy.chatSubtitle} /><Notice>{copy.chatNotice}</Notice></Screen>;
  if (!connected) return <Screen><BrandHeader /><ScreenTitle title={copy.chatTitle} subtitle={copy.chatSubtitle} /><ConnectionState /></Screen>;
  return <LocalChat input={input} setInput={setInput} />;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingVertical: 10 },
  reset: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8 },
  resetText: { color: colors.greenSoft, fontSize: 15 },
  dimmed: { opacity: 0.5 },
  content: { width: '100%', maxWidth: 580, alignSelf: 'center', gap: 20 },
  examples: { gap: 10 },
  example: { padding: 16, minHeight: 52, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  exampleText: { flex: 1 },
  bubble: { maxWidth: '94%', borderRadius: 20, padding: 16 },
  user: { backgroundColor: colors.green, alignSelf: 'flex-end', borderBottomRightRadius: 5 },
  userText: { color: colors.greenInk },
  assistant: { backgroundColor: colors.surface, alignSelf: 'flex-start', borderBottomLeftRadius: 5 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardName: { flex: 1 },
  amount: { fontFamily: fonts.heading, fontSize: 26, lineHeight: 34 },
  muted: { color: colors.muted },
  saved: { color: colors.greenPale, fontFamily: fonts.medium },
  failure: { gap: 12 },
  error: { color: colors.error },
});
