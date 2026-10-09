import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { Keyboard, Modal, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { categories, currencies, intervals, type PaymentInput } from '@/api/types';
import { AppText, Screen, ScreenTitle, sharedStyles } from '@/components/ui';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Action, BackButton, categoryLabel, ConnectionState, DataError, errorText, intervalLabel, LoadingPayments } from '@/payments/components';
import { usePayments } from '@/payments/PaymentsProvider';
import { newDraft, paymentDraft, validateDraft, type FieldErrors, type PaymentDraft } from '@/payments/model';
import { colors, fonts } from '@/theme/theme';

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return <View style={styles.field}>
    <AppText style={styles.label}>{label}</AppText>
    {children}
    {hint && <AppText style={styles.hint}>{hint}</AppText>}
    {error && <AppText style={styles.error} accessibilityLiveRegion="polite">{error}</AppText>}
  </View>;
}

function Choices({ label, values, selected, onChange, disabled }: { label: string; values: { value: string; label: string }[]; selected: string; onChange: (value: string) => void; disabled: boolean }) {
  return <View style={styles.choices} accessibilityRole="radiogroup" accessibilityLabel={label}>
    {values.map(item => <Pressable key={item.value} accessibilityRole="radio" accessibilityLabel={item.label} accessibilityState={{ checked: item.value === selected, disabled }} aria-checked={item.value === selected}
      disabled={disabled} onPress={() => onChange(item.value)} style={({ pressed }) => [styles.choice, item.value === selected && styles.selected, pressed && styles.pressed]}>
      <AppText style={item.value === selected ? styles.selectedText : undefined}>{item.label}</AppText>
    </Pressable>)}
  </View>;
}

function PaymentForm({ initial, id }: { initial: PaymentDraft; id?: number }) {
  const { copy } = useLanguage();
  const { save, remove } = usePayments();
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pending = useRef(false);

  function change(field: keyof PaymentInput, value: string) {
    setDraft(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: undefined }));
  }

  function input(field: keyof PaymentInput, label: string, props: TextInputProps = {}) {
    return <TextInput accessibilityLabel={label} accessibilityHint={errors[field] ? copy[errors[field]] : undefined}
      aria-invalid={Boolean(errors[field])} value={draft[field]} onChangeText={value => change(field, value)} editable={!busy}
      placeholderTextColor={colors.dim} selectionColor={colors.greenSoft} style={[styles.input, errors[field] && styles.invalid]} {...props} />;
  }

  async function submit() {
    if (pending.current) return;
    const validation = validateDraft(draft);
    setErrors(validation.errors);
    setFailure(null);
    if (!validation.value) { setFailure(copy.validationError); return; }
    Keyboard.dismiss();
    pending.current = true;
    setBusy('save');
    try {
      await save(validation.value, id);
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (cause) {
      const error = cause instanceof ApiError ? cause : new ApiError('server');
      if (error.kind === 'validation') {
        setErrors(Object.fromEntries(error.fields.filter(field => field in draft).map(field => [field, 'invalidField'])) as FieldErrors);
      }
      setFailure(['validation', 'unauthorized', 'notFound'].includes(error.kind) ? errorText(error, copy) : copy.saveError);
    } finally { pending.current = false; setBusy(null); }
  }

  async function deletePayment() {
    if (!id || pending.current) return;
    pending.current = true;
    setBusy('delete');
    setFailure(null);
    try {
      await remove(id);
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (cause) {
      const error = cause instanceof ApiError ? cause : new ApiError('server');
      setFailure(error.kind === 'unauthorized' ? copy.sessionExpired : copy.deleteError);
    } finally { pending.current = false; setBusy(null); setConfirmDelete(false); }
  }

  return <Screen>
    <BackButton disabled={Boolean(busy)} />
    <ScreenTitle title={id ? copy.editPayment : copy.addPayment} subtitle={copy.formDescription} />
    <Field label={copy.nameLabel} error={errors.name && copy[errors.name]}>
      {input('name', copy.nameLabel, { placeholder: copy.namePlaceholder, autoCapitalize: 'sentences', maxLength: 121 })}
    </Field>
    <Field label={copy.categoryLabel} error={errors.category && copy[errors.category]}>
      <Choices label={copy.categoryLabel} values={categories.map(value => ({ value, label: categoryLabel(value, copy) }))} selected={draft.category} onChange={value => change('category', value)} disabled={Boolean(busy)} />
    </Field>
    <Field label={copy.amountLabel} error={errors.amount && copy[errors.amount]}>
      {input('amount', copy.amountLabel, { placeholder: '0,00', keyboardType: 'decimal-pad', inputMode: 'decimal', maxLength: 24 })}
    </Field>
    <Field label={copy.currencyLabel} error={errors.currency && copy[errors.currency]}>
      <Choices label={copy.currencyLabel} values={currencies.map(value => ({ value, label: value }))} selected={draft.currency} onChange={value => change('currency', value)} disabled={Boolean(busy)} />
    </Field>
    <Field label={copy.intervalLabel} error={errors.interval_months && copy[errors.interval_months]}>
      <Choices label={copy.intervalLabel} values={intervals.map(value => ({ value: String(value), label: intervalLabel(value, copy) }))} selected={draft.interval_months} onChange={value => change('interval_months', value)} disabled={Boolean(busy)} />
    </Field>
    <Field label={copy.startLabel} hint={copy.dateHint} error={errors.start_date && copy[errors.start_date]}>
      {input('start_date', copy.startLabel, { placeholder: '2026-10-15', autoCapitalize: 'none', autoCorrect: false, maxLength: 10 })}
    </Field>
    <Field label={copy.endLabel} hint={copy.endHint} error={errors.end_date && copy[errors.end_date]}>
      {input('end_date', copy.endLabel, { placeholder: '2027-10-15', autoCapitalize: 'none', autoCorrect: false, maxLength: 10 })}
    </Field>
    <Field label={copy.noteLabel} error={errors.note && copy[errors.note]}>
      {input('note', copy.noteLabel, { placeholder: copy.notePlaceholder, multiline: true, maxLength: 501, style: [styles.input, styles.note, errors.note && styles.invalid] })}
      <AppText style={styles.hint}>{draft.note.length}/500</AppText>
    </Field>
    {failure && <AppText style={styles.error} accessibilityRole="alert">{failure}</AppText>}
    <Action label={busy === 'save' ? copy.saving : copy.save} onPress={() => void submit()} disabled={Boolean(busy)} />
    {id && <Action label={copy.remove} onPress={() => { Keyboard.dismiss(); setConfirmDelete(true); }} disabled={Boolean(busy)} danger />}
    <Modal transparent visible={confirmDelete} animationType="fade" onRequestClose={() => { if (!busy) setConfirmDelete(false); }}>
      <SafeAreaView style={styles.overlay}>
        <View style={[sharedStyles.card, styles.dialog]} accessibilityViewIsModal>
          <AppText accessibilityRole="header" style={sharedStyles.sectionTitle}>{copy.deleteTitle}</AppText>
          <AppText>{draft.name}</AppText>
          <AppText style={sharedStyles.muted}>{copy.deleteDescription}</AppText>
          <Action label={copy.cancel} secondary disabled={Boolean(busy)} onPress={() => setConfirmDelete(false)} />
          <Action label={busy === 'delete' ? copy.removing : copy.remove} danger disabled={Boolean(busy)} onPress={() => void deletePayment()} />
        </View>
      </SafeAreaView>
    </Modal>
  </Screen>;
}

export default function PaymentScreen() {
  const { id: idParam } = useLocalSearchParams<{ id?: string }>();
  const { copy, language } = useLanguage();
  const { connected, data, loading, error } = usePayments();
  const id = idParam === undefined ? undefined : Number(idParam);
  const payment = data?.payments.find(item => item.id === id);
  if (!connected) return <Screen><BackButton /><ConnectionState /></Screen>;
  if (idParam !== undefined && (!Number.isSafeInteger(id) || !id || !payment)) {
    return <Screen><BackButton />{loading ? <LoadingPayments /> : error ? <DataError /> : <AppText>{copy.missingPayment}</AppText>}</Screen>;
  }
  return <PaymentForm key={id ?? 'new'} id={id} initial={payment ? paymentDraft(payment) : newDraft(language)} />;
}

const styles = StyleSheet.create({
  field: { gap: 10 },
  label: { fontFamily: fonts.medium, fontSize: 18 },
  hint: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, color: colors.text, fontFamily: fonts.body, fontSize: 18, minHeight: 52, paddingHorizontal: 16, paddingVertical: 12 },
  note: { minHeight: 112, textAlignVertical: 'top' },
  invalid: { borderColor: colors.error },
  error: { color: colors.error },
  choices: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  choice: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  selected: { borderColor: colors.green, backgroundColor: colors.greenSurface },
  selectedText: { color: colors.greenPale, fontFamily: fonts.medium },
  pressed: { opacity: 0.65 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 24 },
  dialog: { maxWidth: 480, width: '100%', alignSelf: 'center' },
});
