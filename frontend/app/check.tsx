Action: file_editor create /app/frontend/app/(tabs)/check.tsx --file-text "import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  FlatList,
} from \"react-native\";
import { SafeAreaView } from \"react-native-safe-area-context\";
import { useEffect, useState, useCallback } from \"react\";
import { useLocalSearchParams, useRouter } from \"expo-router\";
import {
  Search,
  Pill,
  User as UserIcon,
  ChevronDown,
  X,
  Stethoscope,
} from \"lucide-react-native\";
import { api, Patient } from \"../../src/api\";
import { colors, radii, spacing } from \"../../src/theme\";

export default function CheckScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ patientId?: string }>();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [drug, setDrug] = useState(\"\");
  const [drugs, setDrugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load patients & drugs
  useEffect(() => {
    (async () => {
      const [p, d] = await Promise.all([api.listPatients(), api.listDrugs()]);
      setPatients(p);
      setDrugs(d);
    })();
  }, []);

  // Pre-select if navigated with patientId
  useEffect(() => {
    if (params.patientId && patients.length > 0 && !selected) {
      const found = patients.find((p) => p.id === params.patientId);
      if (found) setSelected(found);
    }
  }, [params.patientId, patients, selected]);

  const submit = useCallback(async () => {
    setError(null);
    if (!selected) {
      setError(\"Please select a patient.\");
      return;
    }
    if (!drug.trim()) {
      setError(\"Please enter a drug name.\");
      return;
    }
    setLoading(true);
    try {
      const result = await api.check(selected.id, drug.trim());
      router.push({ pathname: \"/alert/[id]\", params: { id: result.id } });
    } catch (e: any) {
      setError(e.message || \"Failed to run check\");
    } finally {
      setLoading(false);
    }
  }, [selected, drug, router]);

  const drugSuggestions = drug
    ? drugs.filter((d) => d.toLowerCase().includes(drug.toLowerCase())).slice(0, 5)
    : drugs.slice(0, 5);

  return (
    <SafeAreaView style={styles.safe} edges={[\"top\"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === \"ios\" ? \"padding\" : \"height\"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps=\"handled\"
        >
          <View style={styles.headerRow}>
            <View style={styles.iconBubble}>
              <Stethoscope color={colors.primary} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.h1}>Prescription Check</Text>
              <Text style={styles.subtitle}>
                Cross-reference genotype against CPIC guidelines
              </Text>
            </View>
          </View>

          {/* Patient Selector */}
          <Text style={styles.label}>Patient</Text>
          <TouchableOpacity
            testID=\"patient-selector\"
            style={styles.selector}
            onPress={() => setPickerOpen(true)}
            activeOpacity={0.7}
          >
            <UserIcon color={colors.textMuted} size={18} />
            <View style={{ flex: 1 }}>
              {selected ? (
                <View>
                  <Text style={styles.selectorText}>{selected.name}</Text>
                  <Text style={styles.selectorMeta}>
                    {selected.mrn} · {selected.genotypes.join(\" · \")}
                  </Text>
                </View>
              ) : (
                <Text style={styles.selectorPlaceholder}>
                  Select a patient
                </Text>
              )}
            </View>
            <ChevronDown color={colors.textMuted} size={18} />
          </TouchableOpacity>

          {/* Drug Input */}
          <Text style={styles.label}>Drug Name</Text>
          <View style={styles.inputWrap}>
            <Pill color={colors.textMuted} size={18} />
            <TextInput
              testID=\"drug-search-input\"
              style={styles.input}
              placeholder=\"e.g., Clopidogrel\"
              placeholderTextColor={colors.textMuted}
              value={drug}
              onChangeText={setDrug}
              autoCorrect={false}
              autoCapitalize=\"words\"
              returnKeyType=\"search\"
              onSubmitEditing={submit}
            />
          </View>

          {/* Suggestions */}
          {drugSuggestions.length > 0 && (
            <View style={styles.suggestions}>
              <Text style={styles.suggestionsLabel}>
                {drug ? \"MATCHING DRUGS\" : \"AVAILABLE IN DATABASE\"}
              </Text>
              <View style={styles.suggestionsRow}>
                {drugSuggestions.map((d) => (
                  <TouchableOpacity
                    key={d}
                    testID={`drug-suggestion-${d}`}
                    style={styles.suggestionChip}
                    onPress={() => setDrug(d)}
                  >
                    <Text style={styles.suggestionText}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            testID=\"submit-prescription-button\"
            style={[
              styles.submitBtn,
              (!selected || !drug.trim()) && styles.submitDisabled,
            ]}
            onPress={submit}
            disabled={loading || !selected || !drug.trim()}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color=\"#fff\" />
            ) : (
              <>
                <Search color=\"#fff\" size={18} />
                <Text style={styles.submitText}>Run PGx Check</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>How it works</Text>
            <Text style={styles.helpText}>
              The system matches the patient&apos;s genotypes against the CPIC
              evidence database for the selected drug, then returns one of three
              alert levels: Normal, Warning, or Critical — with dosing
              guidance and alternative therapies.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Patient Picker Modal */}
      <Modal
        visible={pickerOpen}
        animationType=\"slide\"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Patient</Text>
              <TouchableOpacity
                testID=\"close-patient-picker\"
                onPress={() => setPickerOpen(false)}
              >
                <X color={colors.textHighest} size={22} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={patients}
              keyExtractor={(p) => p.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  testID={`picker-patient-${item.mrn}`}
                  style={styles.modalRow}
                  onPress={() => {
                    setSelected(item);
                    setPickerOpen(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalRowName}>{item.name}</Text>
                    <Text style={styles.modalRowMeta}>
                      {item.mrn} · {item.genotypes.join(\" · \")}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  headerRow: {
    flexDirection: \"row\",
    gap: 12,
    alignItems: \"center\",
    marginBottom: spacing.lg,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: \"#DBEAFE\",
    alignItems: \"center\",
    justifyContent: \"center\",
  },
  h1: {
    fontSize: 24,
    fontWeight: \"800\",
    color: colors.textHighest,
    letterSpacing: -0.4,
  },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  label: {
    fontSize: 12,
    fontWeight: \"700\",
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: spacing.md,
  },
  selector: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectorText: { fontSize: 15, fontWeight: \"700\", color: colors.textHighest },
  selectorMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: \"Courier\",
  },
  selectorPlaceholder: { fontSize: 15, color: colors.textMuted },
  inputWrap: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textHighest,
    paddingVertical: 14,
  },
  suggestions: { marginTop: 12 },
  suggestionsLabel: {
    fontSize: 11,
    fontWeight: \"700\",
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  suggestionsRow: { flexDirection: \"row\", flexWrap: \"wrap\", gap: 8 },
  suggestionChip: {
    backgroundColor: \"#EFF6FF\",
    borderWidth: 1,
    borderColor: \"#BFDBFE\",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.chip,
  },
  suggestionText: {
    fontSize: 13,
    color: colors.primaryActive,
    fontWeight: \"600\",
  },
  errorBox: {
    marginTop: spacing.md,
    backgroundColor: colors.criticalBg,
    borderWidth: 1,
    borderColor: colors.criticalBorder,
    padding: 12,
    borderRadius: radii.button,
  },
  errorText: { color: colors.criticalText, fontSize: 13, fontWeight: \"600\" },
  submitBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radii.button,
    alignItems: \"center\",
    justifyContent: \"center\",
    flexDirection: \"row\",
    gap: 8,
  },
  submitDisabled: { backgroundColor: \"#94A3B8\" },
  submitText: {
    color: \"#fff\",
    fontSize: 16,
    fontWeight: \"700\",
    letterSpacing: 0.3,
  },
  helpBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.card,
  },
  helpTitle: {
    fontSize: 13,
    fontWeight: \"700\",
    color: colors.textHighest,
    marginBottom: 4,
  },
  helpText: { fontSize: 13, color: colors.textHigh, lineHeight: 19 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: \"rgba(15,23,42,0.5)\",
    justifyContent: \"flex-end\",
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: \"80%\",
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: \"row\",
    justifyContent: \"space-between\",
    alignItems: \"center\",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: \"800\", color: colors.textHighest },
  modalRow: {
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  modalRowName: {
    fontSize: 15,
    fontWeight: \"700\",
    color: colors.textHighest,
  },
  modalRowMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: \"Courier\",
  },
  sep: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
});
"
Observation: Create successful: /app/frontend/app/(tabs)/check.tsx

Fetching debug logs for expo

==> /var/log/supervisor/expo.err.log <==
Check the Ngrok status page for outages: https://status.ngrok.com/
error Command failed with exit code 1.
CommandError: TypeError: Cannot read properties of undefined (reading 'body')
Check the Ngrok status page for outages: https://status.ngrok.com/
error Command failed with exit code 1.
CommandError: TypeError: Cannot read properties of undefined (reading 'body')
Check the Ngrok status page for outages: https://status.ngrok.com/
error Command failed with exit code 1.
CommandError: TypeError: Cannot read properties of undefined (reading 'body')
Check the Ngrok status page for outages: https://status.ngrok.com/
error Command failed with exit code 1.
CommandError: TypeError: Cannot read properties of undefined (reading 'body')
Check the Ngrok status page for outages: https://status.ngrok.com/
error Command failed with exit code 1.
CommandError: TypeError: Cannot read properties of undefined (reading 'body')
Check the Ngrok status page for outages: https://status.ngrok.com/
error Command failed with exit code 1.
CommandError: TypeError: Cannot read properties of undefined (reading 'body')
Check the Ngrok status page for outages: https://status.ngrok.com/
error Command failed with exit code 1.

==> /var/log/supervisor/expo.out.log <==
Web Bundled 26ms node_modules/expo-router/entry.js (1 module)
λ Bundled 12ms node_modules/expo-router/node/render.js (1 module)

Metro error: ENOENT: no such file or directory, open '/app/frontend/app/index.tsx'

Call Stack
  Object.openSync (node:fs)
  Object.readFileSync (node:fs)
  new Promise (<anonymous>)
Web Bundled 26ms node_modules/expo-router/entry.js (1 module)
λ Bundled 13ms node_modules/expo-router/node/render.js (1 module)

Metro error: ENOENT: no such file or directory, open '/app/frontend/app/index.tsx'

Call Stack
  Object.openSync (node:fs)
  Object.readFileSync (node:fs)
  new Promise (<anonymous>)
Web node_modules/expo-router/entry.js ░░░░░░░░░░░░░░░░  0.0% (0/1)
Web Bundled 34ms node_modules/expo-router/entry.js (1 module)


Fetching debug logs for backend

==> /var/log/supervisor/backend.err.log <==
INFO:     Waiting for application shutdown.
INFO:     Application shutdown complete.
INFO:     Finished server process [225]
INFO:     Stopping reloader process [186]
INFO:     Will watch for changes in these directories: ['/app/backend']
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Started reloader process [408] using WatchFiles
INFO:     Started server process [440]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
WARNING:  WatchFiles detected changes in 'server.py'. Reloading...
INFO:     Shutting down
INFO:     Waiting for application shutdown.
INFO:     Application shutdown complete.
INFO:     Finished server process [440]
INFO:     Started server process [1377]
INFO:     Waiting for application startup.
2026-04-30 13:39:26,893 - root - INFO - Seeded 10 patients
2026-04-30 13:39:26,903 - root - INFO - Seeded 19 gene-drug rules
INFO:     Application startup complete.

==> /var/log/supervisor/backend.out.log <==


Fetching debug logs for mongodb

tail: cannot open '/var/log/supervisor/mongodb*.log' for reading: No such file or directory
