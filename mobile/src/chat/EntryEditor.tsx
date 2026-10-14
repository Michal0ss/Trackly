import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { categories, currencies, intervals } from '@/api/types';
import { AppText, Screen, ScreenTitle } from '@/components/ui';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Action, categoryLabel, intervalLabel } from '@/payments/components';
import { validateDraft, type PaymentDraft } from '@/payments/model';
import { colors, fonts } from '@/theme/theme';

import type { ResolvedEntry } from './types';

export function EntryEditor({ entry, onApply, onCancel }: { entry: ResolvedEntry; onApply: (entry: ResolvedEntry) => void; onCancel: () => void }) {
  const { copy } = useLanguage();
  const [draft, setDraft] = useState<PaymentDraft>({ name: entry.name, category: entry.kind === 'subscription' ? 'other' : entry.category, amount: String(entry.amount), currency: entry.currency, interval_months: String(entry.interval_months), start_date: entry.start_date, end_date: entry.end_date ?? '', note: entry.note ?? '' });
  const [plan, setPlan] = useState(entry.plan_name ?? '');
  const [errors, setErrors] = useState<ReturnType<typeof validateDraft>['errors']>({});
  const change = (key: keyof PaymentDraft, value: string) => { setDraft(previous => ({ ...previous, [key]: value })); setErrors(previous => ({ ...previous, [key]: undefined })); };
  const input = (key: keyof PaymentDraft, label: string, numeric = false) => <View style={styles.field}>
    <AppText style={styles.label}>{label}</AppText>
    <TextInput accessibilityLabel={label} aria-invalid={Boolean(errors[key])} value={draft[key]} onChangeText={value => change(key, value)}
      keyboardType={numeric ? 'decimal-pad' : 'default'} autoCapitalize={key.includes('date') ? 'none' : 'sentences'}
      maxLength={key.includes('date') ? 10 : key === 'name' ? 120 : key === 'amount' ? 24 : 500} style={styles.input} selectionColor={colors.greenSoft} />
    {errors[key] && <AppText style={styles.error}>{copy[errors[key]]}</AppText>}
  </View>;
  const choices = (key: keyof PaymentDraft, label: string, options: { value: string; label: string }[]) => <View style={styles.field}>
    <AppText style={styles.label}>{label}</AppText>
    <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map(option => <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{ checked: draft[key] === option.value }} aria-checked={draft[key] === option.value}
        onPress={() => change(key, option.value)} style={[styles.option, draft[key] === option.value && styles.selected]}><AppText>{option.label}</AppText></Pressable>)}
    </View>
  </View>;
  function apply() {
    const validated = validateDraft(draft);
    setErrors(validated.errors);
    if (validated.value) onApply({ ...validated.value, kind: entry.kind, category: entry.kind === 'subscription' ? 'subscription' : validated.value.category, plan_name: entry.kind === 'subscription' ? plan.trim() || null : null });
  }
  return <Modal visible animationType="slide" onRequestClose={onCancel}>
    <Screen>
      <View style={styles.top}><Action label={copy.cancel} secondary onPress={onCancel} /></View>
      <ScreenTitle title={copy.chatEditTitle} subtitle={copy.chatEditDescription} />
      {input('name', copy.nameLabel)}
      {entry.kind === 'subscription' ? <View style={styles.field}><AppText>{copy.chatPlan}</AppText><TextInput accessibilityLabel={copy.chatPlan} value={plan} onChangeText={setPlan} maxLength={120} style={styles.input} /></View> : choices('category', copy.categoryLabel, categories.map(value => ({ value, label: categoryLabel(value, copy) })))}
      {input('amount', copy.amountLabel, true)}
      {choices('currency', copy.currencyLabel, currencies.map(value => ({ value, label: value })))}
      {choices('interval_months', copy.intervalLabel, intervals.filter(value => entry.kind === 'payment' || value === 1 || value === 12).map(value => ({ value: String(value), label: intervalLabel(value, copy) })))}
      {input('start_date', copy.startLabel)}
      <AppText style={styles.hint}>{copy.dateHint}</AppText>
      {input('end_date', copy.endLabel)}
      {entry.kind === 'payment' && input('note', copy.noteLabel)}
      <Action label={copy.chatApply} onPress={apply} />
    </Screen>
  </Modal>;
}

const styles = StyleSheet.create({
  top: { paddingTop: 16, alignSelf: 'flex-start' },
  field: { gap: 10 },
  label: { fontFamily: fonts.medium },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, minHeight: 52, color: colors.text, backgroundColor: colors.surface, fontFamily: fonts.body, fontSize: 18 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { minHeight: 48, justifyContent: 'center', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  selected: { borderColor: colors.green, backgroundColor: colors.greenSurface },
  error: { color: colors.error },
  hint: { color: colors.muted, fontSize: 14 },
});
