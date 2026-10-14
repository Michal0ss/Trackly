import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { EntryEditor } from '@/chat/EntryEditor';
import { chatReply, createConfirmation, draftFromEntry } from '@/chat/model';
import type { ChatRequest, ChatResponse, EntryDraft, ResolvedEntry } from '@/chat/types';
import { AppText, BrandHeader, IconTile, Notice, Screen, ScreenTitle, sharedStyles } from '@/components/ui';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Action, categoryLabel, ConnectionState, errorText, intervalLabel } from '@/payments/components';
import { usePayments } from '@/payments/PaymentsProvider';
import { categoryIcon, formatDueDate, formatMoney, localDate } from '@/payments/model';
import { colors, fonts } from '@/theme/theme';

type Message = { role: 'user' | 'assistant'; text: string };

function LocalChat() {
  const { copy, language } = useLanguage();
  const { connected, parseChat, confirmChat } = usePayments();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [draft, setDraft] = useState<EntryDraft | null>(null);
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [failure, setFailure] = useState<ApiError | null>(null);
  const [failedRequest, setFailedRequest] = useState<ChatRequest | null>(null);
  const [busy, setBusy] = useState<'parse' | 'save' | null>(null);
  const [saveState, setSaveState] = useState<'ready' | 'uncertain' | 'saved'>('ready');
  const [editing, setEditing] = useState(false);
  const pending = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const confirmation = useRef<ReturnType<typeof createConfirmation> | null>(null);
  const scroll = useRef<ScrollView>(null);

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!connected) {
      controller.current?.abort();
      queueMicrotask(() => { setMessages([]); setDraft(null); setResponse(null); setEditing(false); setInput(''); setFailedRequest(null); });
      confirmation.current = null;
    }
  }, [connected]);

  async function run(request: ChatRequest, append: boolean) {
    if (pending.current || !connected || saveState === 'uncertain') return;
    pending.current = true;
    setBusy('parse'); setFailure(null); setFailedRequest(null); setResponse(null); setSaveState('ready');
    confirmation.current = null;
    const abort = new AbortController();
    controller.current = abort;
    if (append) { setMessages(previous => [...previous.slice(-19), { role: 'user', text: request.text }]); setInput(''); }
    Keyboard.dismiss();
    try {
      const result = await parseChat(request, abort.signal);
      if (abort.signal.aborted) return;
      setResponse(result);
      if (result.result.kind === 'proposal') setDraft(result.result.draft);
      setMessages(previous => [...previous.slice(-19), { role: 'assistant', text: chatReply(result, copy, language) }]);
    } catch (cause) {
      if (abort.signal.aborted) return;
      setFailure(cause instanceof ApiError ? cause : new ApiError('server'));
      setFailedRequest(request);
    } finally { pending.current = false; setBusy(null); }
  }

  function send() {
    const text = input.trim();
    if (!text) return;
    void run({ text, language, today: localDate(), default_currency: draft?.currency ?? (language === 'pl' ? 'PLN' : 'USD'), context: messages.filter(item => item.role === 'user').slice(-6).map(item => item.text), draft }, true);
  }

  async function save() {
    if (pending.current || !response?.entry || !response.proposal_id || saveState === 'saved') return;
    confirmation.current ??= createConfirmation({ proposal_id: response.proposal_id, entry: response.entry }, confirmChat);
    pending.current = true; setBusy('save'); setFailure(null);
    try {
      await confirmation.current();
      setSaveState('saved'); setDraft(null);
    } catch (cause) {
      const error = cause instanceof ApiError ? cause : new ApiError('server');
      if (['validation', 'conflict', 'notFound'].includes(error.kind)) {
        setSaveState('ready'); confirmation.current = null;
      } else setSaveState('uncertain');
      setFailure(error);
    } finally { pending.current = false; setBusy(null); }
  }

  function reset() {
    if (pending.current || saveState === 'uncertain') return;
    setMessages([]); setDraft(null); setResponse(null); setFailure(null); setInput(''); setFailedRequest(null); setSaveState('ready');
    confirmation.current = null;
  }

  function apply(entry: ResolvedEntry) {
    setResponse(previous => previous ? { ...previous, entry } : previous);
    setDraft(draftFromEntry(entry)); setEditing(false);
  }

  const locked = Boolean(busy) || saveState === 'uncertain';
  const entry = response?.entry;
  const examples = language === 'pl'
    ? ['Czynsz 2400 zł', 'Netflix 49 zł co miesiąc', 'Ile płacę miesięcznie?', 'Kiedy mam najbliższą płatność?']
    : ['Paid $1,850 for rent today', 'Netflix $15.49 a month', 'How much do I pay this month?'];

  if (!connected) return <Screen><BrandHeader /><ScreenTitle title={copy.chatTitle} subtitle={copy.chatSubtitle} /><ConnectionState /></Screen>;

  return <SafeAreaView style={styles.page} edges={['top', 'left', 'right']}>
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'web' ? 'none' : 'on-drag'} contentContainerStyle={styles.scroll}
        onContentSizeChange={() => { if (messages.length) scroll.current?.scrollToEnd({ animated: true }); }}>
        <View style={styles.content}>
          <BrandHeader />
          <ScreenTitle title={copy.chatTitle} subtitle={copy.chatSubtitle} />
          <Notice>{copy.chatTestNotice}</Notice>
          {messages.length === 0 ? <View style={styles.examples}>
            <AppText style={sharedStyles.sectionTitle}>{copy.chatTryExample}</AppText>
            {examples.map(text => <Pressable key={text} accessibilityRole="button" accessibilityLabel={text} onPress={() => setInput(text)} style={styles.example}><AppText style={styles.exampleText}>{text}</AppText><Feather name="arrow-down-left" size={18} color={colors.greenSoft} /></Pressable>)}
          </View> : <Action label={copy.chatReset} secondary disabled={locked} onPress={reset} />}
          {messages.map((message, index) => <View key={index} style={[styles.bubble, message.role === 'user' ? styles.user : styles.assistant]}>
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
              <Action label={busy === 'save' ? copy.saving : saveState === 'uncertain' ? copy.chatRetrySave : copy.save} disabled={Boolean(busy)} onPress={() => void save()} />
              <Action label={copy.chatChange} secondary disabled={locked} onPress={() => setEditing(true)} />
            </>}
          </View>}
          {failure && <View style={styles.failure} accessibilityLiveRegion="polite">
            <AppText style={styles.error}>{failure.kind === 'unavailable' ? copy.chatUnavailableError : failure.kind === 'validation' ? copy.chatValidationError : errorText(failure, copy)}</AppText>
            {failedRequest && <Action label={copy.retry} secondary disabled={Boolean(busy)} onPress={() => void run(failedRequest, false)} />}
          </View>}
        </View>
      </ScrollView>
      <View style={styles.composerOuter}><View style={styles.composer}>
        <TextInput accessibilityLabel={copy.chatInput} value={input} onChangeText={setInput} placeholder={copy.chatInput} placeholderTextColor={colors.dim} selectionColor={colors.greenSoft}
          editable={!locked} multiline maxLength={2000} style={styles.input} />
        <Pressable accessibilityRole="button" accessibilityLabel={copy.chatSend} accessibilityState={{ disabled: locked || !input.trim() }} disabled={locked || !input.trim()} onPress={send} style={[styles.send, (locked || !input.trim()) && styles.disabled]}>
          <Feather name="arrow-up" size={22} color={colors.greenInk} />
        </Pressable>
      </View></View>
    </KeyboardAvoidingView>
    {editing && entry && <EntryEditor entry={entry} onApply={apply} onCancel={() => setEditing(false)} />}
  </SafeAreaView>;
}

export default function ChatScreen() {
  const { copy } = useLanguage();
  if (!__DEV__) return <Screen><BrandHeader /><ScreenTitle title={copy.chatTitle} subtitle={copy.chatSubtitle} /><Notice>{copy.chatNotice}</Notice></Screen>;
  return <LocalChat />;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 24 },
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
  composerOuter: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, borderTopWidth: 1, borderTopColor: colors.border },
  composer: { width: '100%', maxWidth: 580, alignSelf: 'center', flexDirection: 'row', alignItems: 'flex-end', gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 24, backgroundColor: colors.surface, padding: 8 },
  input: { flex: 1, minHeight: 46, maxHeight: 130, paddingHorizontal: 10, paddingVertical: 10, fontFamily: fonts.body, fontSize: 17, color: colors.text },
  send: { width: 46, height: 46, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.green },
  disabled: { opacity: 0.4 },
});
