Now let me create the backend and frontend files in parallel.
Action: file_editor create /app/backend/server.py --file-text "from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title=\"PGx Clinical Decision Support API\")
api_router = APIRouter(prefix=\"/api\")


# ---------- Models ----------
class Patient(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mrn: str  # medical record number
    name: str
    age: int
    sex: str
    genotypes: List[str]  # e.g., [\"CYP2C19 *2/*2\", \"VKORC1 AA\"]
    notes: Optional[str] = None


class GeneDrugRule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    gene: str
    drug: str
    drug_lower: str
    genotype: str  # exact genotype string e.g., \"*2/*2\"
    phenotype: str  # e.g., \"Poor Metabolizer\"
    alert_level: str  # Normal | Warning | Critical
    recommendation: str
    alternative_therapy: Optional[str] = None
    cpic_evidence: Optional[str] = None


class CheckRequest(BaseModel):
    patient_id: str
    drug: str


class CheckResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    patient_name: str
    patient_mrn: str
    drug: str
    matched: bool
    gene: Optional[str] = None
    genotype: Optional[str] = None
    phenotype: Optional[str] = None
    alert_level: str  # Normal | Warning | Critical | NoData
    recommendation: str
    alternative_therapy: Optional[str] = None
    cpic_evidence: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ---------- Seed Data ----------
SEED_PATIENTS = [
    {\"mrn\": \"MRN-10001\", \"name\": \"Eleanor Vance\", \"age\": 67, \"sex\": \"F\",
     \"genotypes\": [\"CYP2C19 *2/*2\", \"VKORC1 GG\"], \"notes\": \"Post-PCI, on antiplatelet therapy.\"},
    {\"mrn\": \"MRN-10002\", \"name\": \"Marcus Bell\", \"age\": 54, \"sex\": \"M\",
     \"genotypes\": [\"CYP2C19 *1/*17\", \"CYP2C9 *1/*1\"], \"notes\": \"Atrial fibrillation.\"},
    {\"mrn\": \"MRN-10003\", \"name\": \"Priya Shah\", \"age\": 42, \"sex\": \"F\",
     \"genotypes\": [\"CYP2C9 *3/*3\", \"VKORC1 AA\"], \"notes\": \"DVT, warfarin candidate.\"},
    {\"mrn\": \"MRN-10004\", \"name\": \"Daniel Okafor\", \"age\": 38, \"sex\": \"M\",
     \"genotypes\": [\"HLA-B *57:01 Positive\"], \"notes\": \"Newly diagnosed HIV.\"},
    {\"mrn\": \"MRN-10005\", \"name\": \"Aiko Tanaka\", \"age\": 71, \"sex\": \"F\",
     \"genotypes\": [\"SLCO1B1 *5/*5\"], \"notes\": \"Hyperlipidemia.\"},
    {\"mrn\": \"MRN-10006\", \"name\": \"Ravi Kapoor\", \"age\": 29, \"sex\": \"M\",
     \"genotypes\": [\"CYP2D6 *1/*1xN\"], \"notes\": \"Post-op, pain management.\"},
    {\"mrn\": \"MRN-10007\", \"name\": \"Sofia Reyes\", \"age\": 45, \"sex\": \"F\",
     \"genotypes\": [\"CYP2D6 *4/*4\"], \"notes\": \"Chronic pain.\"},
    {\"mrn\": \"MRN-10008\", \"name\": \"James Carter\", \"age\": 60, \"sex\": \"M\",
     \"genotypes\": [\"CYP2C19 *1/*2\"], \"notes\": \"ACS.\"},
    {\"mrn\": \"MRN-10009\", \"name\": \"Nadia Hassan\", \"age\": 33, \"sex\": \"F\",
     \"genotypes\": [\"TPMT *3A/*3A\"], \"notes\": \"ALL chemotherapy planning.\"},
    {\"mrn\": \"MRN-10010\", \"name\": \"Liam O'Connor\", \"age\": 50, \"sex\": \"M\",
     \"genotypes\": [\"CYP2C19 *1/*1\", \"CYP2C9 *1/*1\"], \"notes\": \"Routine monitoring.\"},
]


SEED_RULES = [
    # --- CYP2C19 / Clopidogrel ---
    {\"gene\": \"CYP2C19\", \"drug\": \"Clopidogrel\", \"genotype\": \"*1/*1\", \"phenotype\": \"Normal Metabolizer\",
     \"alert_level\": \"Normal\",
     \"recommendation\": \"Standard dosing: Clopidogrel 75 mg daily after a 300–600 mg loading dose. No genotype-based adjustment needed.\",
     \"alternative_therapy\": None,
     \"cpic_evidence\": \"CPIC Level A — Strong\"},
    {\"gene\": \"CYP2C19\", \"drug\": \"Clopidogrel\", \"genotype\": \"*1/*17\", \"phenotype\": \"Rapid Metabolizer\",
     \"alert_level\": \"Normal\",
     \"recommendation\": \"Standard dosing. Rapid metabolizers achieve normal-to-enhanced antiplatelet response.\",
     \"alternative_therapy\": None,
     \"cpic_evidence\": \"CPIC Level A\"},
    {\"gene\": \"CYP2C19\", \"drug\": \"Clopidogrel\", \"genotype\": \"*1/*2\", \"phenotype\": \"Intermediate Metabolizer\",
     \"alert_level\": \"Warning\",
     \"recommendation\": \"Reduced platelet inhibition expected. Consider alternative antiplatelet therapy, especially in ACS/PCI.\",
     \"alternative_therapy\": \"Prasugrel 10 mg daily or Ticagrelor 90 mg BID (if no contraindication).\",
     \"cpic_evidence\": \"CPIC Level A — Moderate\"},
    {\"gene\": \"CYP2C19\", \"drug\": \"Clopidogrel\", \"genotype\": \"*2/*2\", \"phenotype\": \"Poor Metabolizer\",
     \"alert_level\": \"Critical\",
     \"recommendation\": \"AVOID Clopidogrel. Significantly reduced active metabolite formation — high risk of stent thrombosis and recurrent cardiovascular events.\",
     \"alternative_therapy\": \"Prasugrel 10 mg daily OR Ticagrelor 90 mg BID. Verify no bleeding contraindications.\",
     \"cpic_evidence\": \"CPIC Level A — Strong\"},

    # --- CYP2C9 + VKORC1 / Warfarin ---
    {\"gene\": \"CYP2C9\", \"drug\": \"Warfarin\", \"genotype\": \"*1/*1\", \"phenotype\": \"Normal Metabolizer\",
     \"alert_level\": \"Normal\",
     \"recommendation\": \"Standard warfarin initiation per institutional protocol. Monitor INR routinely.\",
     \"alternative_therapy\": None,
     \"cpic_evidence\": \"CPIC Level A\"},
    {\"gene\": \"CYP2C9\", \"drug\": \"Warfarin\", \"genotype\": \"*3/*3\", \"phenotype\": \"Poor Metabolizer\",
     \"alert_level\": \"Critical\",
     \"recommendation\": \"AVOID Warfarin if alternatives exist. If used, reduce dose by 50–80% and monitor INR closely. High bleeding risk.\",
     \"alternative_therapy\": \"Direct oral anticoagulants (DOAC) such as Apixaban or Rivaroxaban if not contraindicated.\",
     \"cpic_evidence\": \"CPIC Level A — Strong\"},
    {\"gene\": \"VKORC1\", \"drug\": \"Warfarin\", \"genotype\": \"AA\", \"phenotype\": \"Increased Sensitivity\",
     \"alert_level\": \"Warning\",
     \"recommendation\": \"Initiate warfarin at a lower dose (≈2–3 mg/day). Use CPIC dosing algorithm. Frequent INR monitoring.\",
     \"alternative_therapy\": None,
     \"cpic_evidence\": \"CPIC Level A\"},
    {\"gene\": \"VKORC1\", \"drug\": \"Warfarin\", \"genotype\": \"GG\", \"phenotype\": \"Normal Sensitivity\",
     \"alert_level\": \"Normal\",
     \"recommendation\": \"Standard warfarin dosing. Normal vitamin K epoxide reductase activity.\",
     \"alternative_therapy\": None,
     \"cpic_evidence\": \"CPIC Level A\"},

    # --- SLCO1B1 / Simvastatin ---
    {\"gene\": \"SLCO1B1\", \"drug\": \"Simvastatin\", \"genotype\": \"*5/*5\", \"phenotype\": \"Poor Function\",
     \"alert_level\": \"Critical\",
     \"recommendation\": \"AVOID Simvastatin 80 mg. High risk of myopathy and rhabdomyolysis. Limit to ≤20 mg/day if used.\",
     \"alternative_therapy\": \"Switch to Rosuvastatin 10–20 mg or Pravastatin 40 mg daily.\",
     \"cpic_evidence\": \"CPIC Level A — Strong\"},

    # --- HLA-B*57:01 / Abacavir ---
    {\"gene\": \"HLA-B\", \"drug\": \"Abacavir\", \"genotype\": \"*57:01 Positive\", \"phenotype\": \"Hypersensitivity Risk\",
     \"alert_level\": \"Critical\",
     \"recommendation\": \"DO NOT PRESCRIBE Abacavir. Risk of fatal hypersensitivity reaction.\",
     \"alternative_therapy\": \"Substitute with Tenofovir alafenamide (TAF) or Tenofovir disoproxil (TDF) based regimen.\",
     \"cpic_evidence\": \"CPIC Level A — Strong\"},

    # --- CYP2D6 / Codeine ---
    {\"gene\": \"CYP2D6\", \"drug\": \"Codeine\", \"genotype\": \"*1/*1\", \"phenotype\": \"Normal Metabolizer\",
     \"alert_level\": \"Normal\",
     \"recommendation\": \"Standard codeine dosing 15–60 mg every 4 hours as needed. Max 360 mg/day.\",
     \"alternative_therapy\": None,
     \"cpic_evidence\": \"CPIC Level A\"},
    {\"gene\": \"CYP2D6\", \"drug\": \"Codeine\", \"genotype\": \"*4/*4\", \"phenotype\": \"Poor Metabolizer\",
     \"alert_level\": \"Warning\",
     \"recommendation\": \"Avoid codeine — insufficient conversion to morphine results in inadequate analgesia.\",
     \"alternative_therapy\": \"Use a non-codeine opioid (e.g., morphine, hydromorphone) or non-opioid analgesic.\",
     \"cpic_evidence\": \"CPIC Level A\"},
    {\"gene\": \"CYP2D6\", \"drug\": \"Codeine\", \"genotype\": \"*1/*1xN\", \"phenotype\": \"Ultrarapid Metabolizer\",
     \"alert_level\": \"Critical\",
     \"recommendation\": \"AVOID codeine. Ultra-rapid conversion to morphine causes life-threatening respiratory depression.\",
     \"alternative_therapy\": \"Use non-codeine analgesic — morphine, hydromorphone, or non-opioid (acetaminophen/ibuprofen).\",
     \"cpic_evidence\": \"CPIC Level A — Strong\"},

    # --- CYP2D6 / Ondansetron ---
    {\"gene\": \"CYP2D6\", \"drug\": \"Ondansetron\", \"genotype\": \"*1/*1xN\", \"phenotype\": \"Ultrarapid Metabolizer\",
     \"alert_level\": \"Warning\",
     \"recommendation\": \"Standard ondansetron dose may be ineffective due to rapid metabolism.\",
     \"alternative_therapy\": \"Switch to Granisetron or another 5-HT3 antagonist not metabolized by CYP2D6.\",
     \"cpic_evidence\": \"CPIC Level A\"},

    # --- TPMT / Mercaptopurine / Azathioprine ---
    {\"gene\": \"TPMT\", \"drug\": \"Mercaptopurine\", \"genotype\": \"*1/*1\", \"phenotype\": \"Normal Activity\",
     \"alert_level\": \"Normal\",
     \"recommendation\": \"Standard starting dose per protocol. Monitor CBC routinely.\",
     \"alternative_therapy\": None,
     \"cpic_evidence\": \"CPIC Level A\"},
    {\"gene\": \"TPMT\", \"drug\": \"Mercaptopurine\", \"genotype\": \"*3A/*3A\", \"phenotype\": \"Poor Metabolizer\",
     \"alert_level\": \"Critical\",
     \"recommendation\": \"AVOID standard dose. Risk of life-threatening myelosuppression. Reduce dose by 90% or choose alternative.\",
     \"alternative_therapy\": \"Reduce mercaptopurine to 10% of standard dose with intensive CBC monitoring, or substitute with non-thiopurine therapy.\",
     \"cpic_evidence\": \"CPIC Level A — Strong\"},
    {\"gene\": \"TPMT\", \"drug\": \"Azathioprine\", \"genotype\": \"*3A/*3A\", \"phenotype\": \"Poor Metabolizer\",
     \"alert_level\": \"Critical\",
     \"recommendation\": \"AVOID azathioprine. Severe myelotoxicity expected.\",
     \"alternative_therapy\": \"Use a non-thiopurine immunosuppressant (e.g., methotrexate, mycophenolate).\",
     \"cpic_evidence\": \"CPIC Level A — Strong\"},

    # --- CYP2C19 / Voriconazole ---
    {\"gene\": \"CYP2C19\", \"drug\": \"Voriconazole\", \"genotype\": \"*2/*2\", \"phenotype\": \"Poor Metabolizer\",
     \"alert_level\": \"Warning\",
     \"recommendation\": \"Higher voriconazole exposure — risk of toxicity. Consider lower dose or therapeutic drug monitoring.\",
     \"alternative_therapy\": \"Consider isavuconazole or posaconazole.\",
     \"cpic_evidence\": \"CPIC Level A\"},
    {\"gene\": \"CYP2C19\", \"drug\": \"Voriconazole\", \"genotype\": \"*1/*17\", \"phenotype\": \"Rapid Metabolizer\",
     \"alert_level\": \"Warning\",
     \"recommendation\": \"Subtherapeutic voriconazole levels likely. Consider alternative antifungal.\",
     \"alternative_therapy\": \"Isavuconazole, posaconazole, or amphotericin B.\",
     \"cpic_evidence\": \"CPIC Level A\"},
]


# ---------- Helpers ----------
async def seed_if_empty():
    if await db.patients.count_documents({}) == 0:
        patients = [Patient(**p).model_dump() for p in SEED_PATIENTS]
        await db.patients.insert_many(patients)
        logging.info(f\"Seeded {len(patients)} patients\")
    if await db.gene_drug_rules.count_documents({}) == 0:
        rules = []
        for r in SEED_RULES:
            rules.append(GeneDrugRule(drug_lower=r[\"drug\"].lower(), **r).model_dump())
        await db.gene_drug_rules.insert_many(rules)
        logging.info(f\"Seeded {len(rules)} gene-drug rules\")


def parse_genotypes(genotypes: List[str]):
    \"\"\"Parse strings like 'CYP2C19 *2/*2' into [{gene, genotype}]\"\"\"
    out = []
    for g in genotypes:
        parts = g.strip().split(\" \", 1)
        if len(parts) == 2:
            out.append({\"gene\": parts[0], \"genotype\": parts[1]})
        else:
            out.append({\"gene\": parts[0], \"genotype\": \"\"})
    return out


# ---------- Routes ----------
@api_router.get(\"/\")
async def root():
    return {\"message\": \"PGx Clinical Decision Support API\"}


@api_router.get(\"/patients\", response_model=List[Patient])
async def list_patients(q: Optional[str] = None):
    query = {}
    if q:
        query = {\"$or\": [
            {\"name\": {\"$regex\": q, \"$options\": \"i\"}},
            {\"mrn\": {\"$regex\": q, \"$options\": \"i\"}},
            {\"genotypes\": {\"$regex\": q, \"$options\": \"i\"}},
        ]}
    docs = await db.patients.find(query, {\"_id\": 0}).to_list(500)
    return [Patient(**d) for d in docs]


@api_router.get(\"/patients/{patient_id}\", response_model=Patient)
async def get_patient(patient_id: str):
    doc = await db.patients.find_one({\"id\": patient_id}, {\"_id\": 0})
    if not doc:
        raise HTTPException(status_code=404, detail=\"Patient not found\")
    return Patient(**doc)


@api_router.get(\"/drugs\", response_model=List[str])
async def list_drugs(q: Optional[str] = None):
    \"\"\"Return unique drug names for autocomplete.\"\"\"
    pipeline = [{\"$group\": {\"_id\": \"$drug\"}}, {\"$sort\": {\"_id\": 1}}]
    docs = await db.gene_drug_rules.aggregate(pipeline).to_list(500)
    drugs = [d[\"_id\"] for d in docs]
    if q:
        drugs = [d for d in drugs if q.lower() in d.lower()]
    return drugs


@api_router.post(\"/check\", response_model=CheckResult)
async def check_prescription(req: CheckRequest):
    pdoc = await db.patients.find_one({\"id\": req.patient_id}, {\"_id\": 0})
    if not pdoc:
        raise HTTPException(status_code=404, detail=\"Patient not found\")
    patient = Patient(**pdoc)

    drug_query = req.drug.strip()
    if not drug_query:
        raise HTTPException(status_code=400, detail=\"Drug name is required\")

    parsed = parse_genotypes(patient.genotypes)
    # Find rules for this drug (case-insensitive)
    rules = await db.gene_drug_rules.find(
        {\"drug_lower\": drug_query.lower()}, {\"_id\": 0}
    ).to_list(200)

    matched_rule = None
    for pg in parsed:
        for r in rules:
            if r[\"gene\"].lower() == pg[\"gene\"].lower() and r[\"genotype\"].lower() == pg[\"genotype\"].lower():
                # Pick highest severity if multiple match (Critical > Warning > Normal)
                if matched_rule is None:
                    matched_rule = r
                else:
                    order = {\"Critical\": 3, \"Warning\": 2, \"Normal\": 1}
                    if order.get(r[\"alert_level\"], 0) > order.get(matched_rule[\"alert_level\"], 0):
                        matched_rule = r

    if matched_rule:
        result = CheckResult(
            patient_id=patient.id,
            patient_name=patient.name,
            patient_mrn=patient.mrn,
            drug=drug_query,
            matched=True,
            gene=matched_rule[\"gene\"],
            genotype=matched_rule[\"genotype\"],
            phenotype=matched_rule[\"phenotype\"],
            alert_level=matched_rule[\"alert_level\"],
            recommendation=matched_rule[\"recommendation\"],
            alternative_therapy=matched_rule.get(\"alternative_therapy\"),
            cpic_evidence=matched_rule.get(\"cpic_evidence\"),
        )
    else:
        # Drug exists in DB but no genotype match → likely Normal default for this patient
        if rules:
            result = CheckResult(
                patient_id=patient.id,
                patient_name=patient.name,
                patient_mrn=patient.mrn,
                drug=drug_query,
                matched=False,
                alert_level=\"Normal\",
                recommendation=f\"No specific PGx alert found for this patient's genotypes with {drug_query}. Standard dosing applies. Continue routine monitoring.\",
                alternative_therapy=None,
                cpic_evidence=None,
            )
        else:
            result = CheckResult(
                patient_id=patient.id,
                patient_name=patient.name,
                patient_mrn=patient.mrn,
                drug=drug_query,
                matched=False,
                alert_level=\"NoData\",
                recommendation=f\"No CPIC pharmacogenomic guideline currently in database for '{drug_query}'. Use clinical judgment and refer to standard prescribing references.\",
                alternative_therapy=None,
                cpic_evidence=None,
            )

    # Save to history
    await db.prescription_history.insert_one(result.model_dump())
    return result


@api_router.get(\"/history\", response_model=List[CheckResult])
async def get_history(patient_id: Optional[str] = None, limit: int = 100):
    query = {}
    if patient_id:
        query[\"patient_id\"] = patient_id
    docs = await db.prescription_history.find(query, {\"_id\": 0}).sort(\"timestamp\", -1).to_list(limit)
    return [CheckResult(**d) for d in docs]


@api_router.get(\"/rules\", response_model=List[GeneDrugRule])
async def list_rules():
    docs = await db.gene_drug_rules.find({}, {\"_id\": 0}).to_list(500)
    return [GeneDrugRule(**d) for d in docs]


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[\"*\"],
    allow_methods=[\"*\"],
    allow_headers=[\"*\"],
)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event(\"startup\")
async def on_startup():
    await seed_if_empty()


@app.on_event(\"shutdown\")
async def shutdown_db_client():
    client.close()
"
Observation: Overwrite successful: /app/backend/server.py

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
$ /app/frontend/node_modules/.bin/expo start --tunnel --port 3000
env: load .env
env: export EXPO_TUNNEL_SUBDOMAIN EXPO_PACKAGER_HOSTNAME EXPO_PUBLIC_BACKEND_URL EXPO_USE_FAST_RESOLVER METRO_CACHE_ROOT
Starting project at /app/frontend
Fast resolver is enabled.
Metro is running in CI mode, reloads are disabled. Remove CI=true to enable watch mode.
Starting Metro Bundler
info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.
yarn run v1.22.22
$ /app/frontend/node_modules/.bin/expo start --tunnel --port 3000
env: load .env
env: export EXPO_TUNNEL_SUBDOMAIN EXPO_PACKAGER_HOSTNAME EXPO_PUBLIC_BACKEND_URL EXPO_USE_FAST_RESOLVER METRO_CACHE_ROOT
Starting project at /app/frontend
Fast resolver is enabled.
Metro is running in CI mode, reloads are disabled. Remove CI=true to enable watch mode.
Starting Metro Bundler
Tunnel connected.
Tunnel ready.
Waiting on http://localhost:3000
Logs for your project will appear below.


Fetching debug logs for backend

==> /var/log/supervisor/backend.err.log <==
INFO:     Will watch for changes in these directories: ['/app/backend']
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Started reloader process [186] using WatchFiles
INFO:     Started server process [225]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Shutting down
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

==> /var/log/supervisor/backend.out.log <==


Fetching debug logs for mongodb

tail: cannot open '/var/log/supervisor/mongodb*.log' for reading: No such file or directory