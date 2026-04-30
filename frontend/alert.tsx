Now the alert detail screen — the core color-coded card with PDF export.
Action: file_editor create /app/frontend/app/alert/[id].tsx --file-text "import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from \"react-native\";
import { SafeAreaView } from \"react-native-safe-area-context\";
import { useEffect, useState } from \"react\";
import { useLocalSearchParams, useRouter } from \"expo-router\";
import {
  CheckCircle,
  AlertTriangle,
  OctagonAlert,
  Info,
  ChevronLeft,
  FileText,
  Share2,
} from \"lucide-react-native\";
import * as Haptics from \"expo-haptics\";
import * as Print from \"expo-print\";
import * as Sharing from \"expo-sharing\";
import { api, CheckResult } from \"../../src/api\";
import { colors, radii, spacing } from \"../../src/theme\";

export default function AlertScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const all = await api.history();
        const found = all.find((r) => r.id === id);
        setResult(found || null);
        if (found) {
          // Haptic feedback by severity
          if (found.alert_level === \"Critical\") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          } else if (found.alert_level === \"Warning\") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } else if (found.alert_level === \"Normal\") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }
  if (!result) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Alert not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isCritical = result.alert_level === \"Critical\";
  const isWarning = result.alert_level === \"Warning\";
  const isNormal = result.alert_level === \"Normal\";
  const isNoData = result.alert_level === \"NoData\";

  const cardStyle = isCritical
    ? styles.cardCritical
    : isWarning
    ? styles.cardWarning
    : isNormal
    ? styles.cardNormal
    : styles.cardNoData;

  const titleColor = isCritical
    ? \"#fff\"
    : isWarning
    ? colors.warningText
    : isNormal
    ? colors.normalText
    : colors.noDataText;

  const bodyColor = isCritical ? \"rgba(255,255,255,0.95)\" : titleColor;

  const Icon = isCritical
    ? OctagonAlert
    : isWarning
    ? AlertTriangle
    : isNormal
    ? CheckCircle
    : Info;

  const iconColor = isCritical
    ? \"#fff\"
    : isWarning
    ? colors.warningIcon
    : isNormal
    ? colors.normalIcon
    : colors.noDataBorder;

  const levelLabel = isCritical
    ? \"CRITICAL — AVOID DRUG\"
    : isWarning
    ? \"WARNING — DOSE ADJUSTMENT\"
    : isNormal
    ? \"NORMAL — STANDARD DOSING\"
    : \"NO PGx DATA AVAILABLE\";

  const exportPDF = async () => {
    setExporting(true);
    try {
      const html = buildHtml(result);
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: \"application/pdf\",
          dialogTitle: \"Share PGx Alert\",
          UTI: \"com.adobe.pdf\",
        });
      } else {
        Alert.alert(\"PDF Generated\", `Saved to: ${uri}`);
      }
    } catch (e: any) {
      Alert.alert(\"Export Failed\", e.message || \"Could not generate PDF.\");
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={[\"top\"]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          testID=\"alert-back-button\"
          onPress={() => router.back()}
          style={styles.iconBtn}
          hitSlop={10}
        >
          <ChevronLeft color={colors.textHighest} size={24} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Clinical Alert</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Patient & Drug header */}
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>PATIENT</Text>
          <Text style={styles.summaryName}>{result.patient_name}</Text>
          <Text style={styles.summaryMeta}>{result.patient_mrn}</Text>

          <View style={styles.divider} />

          <Text style={styles.summaryLabel}>PRESCRIBED DRUG</Text>
          <Text style={styles.summaryDrug}>{result.drug}</Text>

          {result.gene && result.genotype && (
            <>
              <View style={styles.divider} />
              <Text style={styles.summaryLabel}>MATCHED GENOTYPE</Text>
              <View style={styles.genoChip}>
                <Text style={styles.genoChipText}>
                  {result.gene} {result.genotype}
                </Text>
              </View>
              {result.phenotype && (
                <Text style={styles.phenotype}>{result.phenotype}</Text>
              )}
            </>
          )}
        </View>

        {/* The Big Alert Card */}
        <View
          testID={`alert-${result.alert_level.toLowerCase()}-card`}
          style={[styles.card, cardStyle]}
        >
          <View style={styles.cardHead}>
            <Icon color={iconColor} size={32} />
            <Text style={[styles.levelLabel, { color: titleColor }]}>
              {levelLabel}
            </Text>
          </View>

          <Text style={[styles.sectionLabel, { color: bodyColor, opacity: 0.85 }]}>
            RECOMMENDATION
          </Text>
          <Text style={[styles.recommendation, { color: bodyColor }]}>
            {result.recommendation}
          </Text>

          {result.alternative_therapy && (
            <>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: bodyColor, opacity: 0.85, marginTop: spacing.md },
                ]}
              >
                ALTERNATIVE THERAPY
              </Text>
              <Text style={[styles.alt, { color: bodyColor }]}>
                {result.alternative_therapy}
              </Text>
            </>
          )}

          {result.cpic_evidence && (
            <View
              style={[
                styles.evidence,
                isCritical && { backgroundColor: \"rgba(255,255,255,0.15)\" },
              ]}
            >
              <Text
                style={[
                  styles.evidenceText,
                  { color: isCritical ? \"#fff\" : colors.textHigh },
                ]}
              >
                Evidence: {result.cpic_evidence}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <TouchableOpacity
          testID=\"export-pdf-button\"
          activeOpacity={0.8}
          style={styles.actionBtn}
          onPress={exportPDF}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color=\"#fff\" />
          ) : (
            <>
              <FileText color=\"#fff\" size={18} />
              <Text style={styles.actionText}>Export PDF</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          testID=\"share-button\"
          activeOpacity={0.8}
          style={[styles.actionBtn, styles.actionSecondary]}
          onPress={exportPDF}
        >
          <Share2 color={colors.primary} size={18} />
          <Text style={[styles.actionText, { color: colors.primary }]}>
            Share Alert
          </Text>
        </TouchableOpacity>

        <Text style={styles.footnote}>
          Decision support only. Final prescribing decisions remain at the
          clinician&apos;s discretion. Refer to current CPIC guidelines.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function buildHtml(r: CheckResult) {
  const color =
    r.alert_level === \"Critical\"
      ? \"#DC2626\"
      : r.alert_level === \"Warning\"
      ? \"#D97706\"
      : r.alert_level === \"Normal\"
      ? \"#059669\"
      : \"#3B82F6\";
  return `<!doctype html><html><head><meta charset=\"utf-8\" />
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; padding: 32px; color: #0F172A; }
    h1 { margin: 0 0 4px; }
    .sub { color: #64748B; margin-bottom: 24px; }
    .card { border-radius: 14px; padding: 20px; color:#fff; background: ${color}; }
    .label { font-size: 11px; letter-spacing: 1px; color:#64748B; text-transform: uppercase; margin-top: 16px; }
    .val { font-size: 16px; font-weight: 600; }
    .recom { font-size: 16px; line-height: 1.5; margin-top: 8px; }
    .footnote { color: #94A3B8; font-size: 11px; margin-top: 32px; }
  </style></head><body>
    <h1>RxGenomics — Clinical Alert</h1>
    <div class=\"sub\">Generated ${new Date(r.timestamp).toLocaleString()}</div>
    <div class=\"label\">Patient</div><div class=\"val\">${r.patient_name} (${r.patient_mrn})</div>
    <div class=\"label\">Drug</div><div class=\"val\">${r.drug}</div>
    ${r.gene ? `<div class=\"label\">Genotype</div><div class=\"val\">${r.gene} ${r.genotype} — ${r.phenotype || \"\"}</div>` : \"\"}
    <div class=\"card\">
      <div style=\"font-size:14px; letter-spacing:1px; opacity:0.9\">${r.alert_level.toUpperCase()}</div>
      <div class=\"recom\">${r.recommendation}</div>
      ${r.alternative_therapy ? `<div style=\"margin-top:14px; opacity:0.95\"><b>Alternative:</b> ${r.alternative_therapy}</div>` : \"\"}
    </div>
    ${r.cpic_evidence ? `<div class=\"label\">Evidence</div><div class=\"val\">${r.cpic_evidence}</div>` : \"\"}
    <div class=\"footnote\">Decision support only. Final prescribing decisions remain at the clinician's discretion.</div>
  </body></html>`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: \"row\",
    alignItems: \"center\",
    justifyContent: \"space-between\",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconBtn: { padding: 4 },
  topBarTitle: { fontSize: 16, fontWeight: \"700\", color: colors.textHighest },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: \"700\",
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryName: { fontSize: 18, fontWeight: \"800\", color: colors.textHighest },
  summaryMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  summaryDrug: { fontSize: 20, fontWeight: \"800\", color: colors.textHighest },
  phenotype: { fontSize: 13, color: colors.textHigh, marginTop: 6 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  genoChip: {
    alignSelf: \"flex-start\",
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.chip,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genoChipText: {
    fontSize: 14,
    fontWeight: \"700\",
    color: colors.textHighest,
    fontFamily: \"Courier\",
    letterSpacing: 1,
  },

  card: {
    borderRadius: radii.cardLg,
    padding: spacing.lg,
    borderWidth: 2,
    marginBottom: spacing.md,
  },
  cardCritical: {
    backgroundColor: colors.criticalCardBg,
    borderColor: \"#991B1B\",
  },
  cardWarning: { backgroundColor: colors.warningBg, borderColor: colors.warningBorder },
  cardNormal: { backgroundColor: colors.normalBg, borderColor: colors.normalBorder },
  cardNoData: { backgroundColor: colors.noDataBg, borderColor: colors.noDataBorder },
  cardHead: {
    flexDirection: \"row\",
    alignItems: \"center\",
    gap: 12,
    marginBottom: spacing.md,
  },
  levelLabel: {
    fontSize: 16,
    fontWeight: \"900\",
    letterSpacing: 0.6,
    flex: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: \"800\",
    letterSpacing: 1,
    marginBottom: 6,
  },
  recommendation: { fontSize: 17, fontWeight: \"600\", lineHeight: 24 },
  alt: { fontSize: 16, fontWeight: \"500\", lineHeight: 23 },
  evidence: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  evidenceText: { fontSize: 12, fontWeight: \"600\" },

  actionBtn: {
    flexDirection: \"row\",
    alignItems: \"center\",
    justifyContent: \"center\",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radii.button,
    marginTop: 8,
  },
  actionSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionText: { color: \"#fff\", fontSize: 15, fontWeight: \"700\" },
  footnote: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: \"center\",
    marginTop: spacing.lg,
    lineHeight: 16,
  },
  center: { alignItems: \"center\", padding: 40 },
  errorText: { color: colors.criticalText, fontSize: 16 },
  backBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radii.button,
  },
  backBtnText: { color: \"#fff\", fontWeight: \"700\" },
});
"
Observation: Create successful: /app/frontend/app/alert/[id].tsx

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