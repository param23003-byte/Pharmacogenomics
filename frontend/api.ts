
Action: file_editor create /app/frontend/src/api.ts --file-text "// Lightweight API client for the PGx app
const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export type Patient = {
  id: string;
  mrn: string;
  name: string;
  age: number;
  sex: string;
  genotypes: string[];
  notes?: string | null;
};

export type CheckResult = {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_mrn: string;
  drug: string;
  matched: boolean;
  gene?: string | null;
  genotype?: string | null;
  phenotype?: string | null;
  alert_level: \"Normal\" | \"Warning\" | \"Critical\" | \"NoData\";
  recommendation: string;
  alternative_therapy?: string | null;
  cpic_evidence?: string | null;
  timestamp: string;
};

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { \"Content-Type\": \"application/json\" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  listPatients: (q?: string) =>
    http<Patient[]>(`/patients${q ? `?q=${encodeURIComponent(q)}` : \"\"}`),
  getPatient: (id: string) => http<Patient>(`/patients/${id}`),
  listDrugs: (q?: string) =>
    http<string[]>(`/drugs${q ? `?q=${encodeURIComponent(q)}` : \"\"}`),
  check: (patient_id: string, drug: string) =>
    http<CheckResult>(`/check`, {
      method: \"POST\",
      body: JSON.stringify({ patient_id, drug }),
    }),
  history: (patient_id?: string) =>
    http<CheckResult[]>(
      `/history${patient_id ? `?patient_id=${patient_id}` : \"\"}`,
    ),
};
"
Observation: Create successful: /app/frontend/src/api.ts

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
  new Promise (<anonymous>)
λ Bundled 18ms node_modules/expo-router/node/render.js (1 module)

Metro error: ENOENT: no such file or directory, open '/app/frontend/app/index.tsx'

Call Stack
  Object.openSync (node:fs)
  Object.readFileSync (node:fs)
  new Promise (<anonymous>)
Web node_modules/expo-router/entry.js ░░░░░░░░░░░░░░░░  0.0% (0/1)
Web Bundled 34ms node_modules/expo-router/entry.js (1 module)
λ Bundled 13ms node_modules/expo-router/node/render.js (1 module)

Metro error: ENOENT: no such file or directory, open '/app/frontend/app/index.tsx'

Call Stack
  Object.openSync (node:fs)
  Object.readFileSync (node:fs)
  new Promise (<anonymous>)
Web Bundled 28ms node_modules/expo-router/entry.js (1 module)


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