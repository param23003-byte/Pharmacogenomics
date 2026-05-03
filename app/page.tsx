'use client';

import { useState } from 'react';
import { Search, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import PatientSearch from '@/components/PatientSearch';
import DrugGeneInteractions from '@/components/DrugGeneInteractions';
import Header from '@/components/Header';
import { Patient, DrugInteraction } from '@/types';

// Mock data for patients
const MOCK_PATIENTS: Patient[] = [
  {
    id: '1',
    name: 'John Smith',
    age: 45,
    gender: 'Male',
    medications: ['Warfarin', 'Metoprolol'],
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    age: 52,
    gender: 'Female',
    medications: ['Clopidogrel', 'Atorvastatin'],
  },
  {
    id: '3',
    name: 'Michael Brown',
    age: 38,
    gender: 'Male',
    medications: ['Omeprazole', 'Simvastatin'],
  },
  {
    id: '4',
    name: 'Emma Davis',
    age: 61,
    gender: 'Female',
    medications: ['Codeine', 'Tamoxifen'],
  },
];

// Mock drug-gene interactions database
const DRUG_GENE_DATABASE: Record<string, DrugInteraction[]> = {
  Warfarin: [
    {
      gene: 'CYP2C9',
      allele: '*1/*1',
      recommendation: 'Standard dosing',
      risk: 'Low',
    },
    {
      gene: 'CYP2C9',
      allele: '*1/*2',
      recommendation: 'Reduce dose by 25-30%',
      risk: 'Medium',
    },
    {
      gene: 'CYP2C9',
      allele: '*2/*2',
      recommendation: 'Reduce dose by 50%',
      risk: 'High',
    },
    {
      gene: 'VKORC1',
      allele: '-1639G>A',
      recommendation: 'Dose adjustment may be needed',
      risk: 'Medium',
    },
  ],
  Clopidogrel: [
    {
      gene: 'CYP2C19',
      allele: '*1/*1',
      recommendation: 'Standard dosing',
      risk: 'Low',
    },
    {
      gene: 'CYP2C19',
      allele: '*1/*2',
      recommendation: 'Monitor effectiveness',
      risk: 'Medium',
    },
    {
      gene: 'CYP2C19',
      allele: '*2/*2',
      recommendation: 'Consider alternative therapy',
      risk: 'High',
    },
  ],
  Codeine: [
    {
      gene: 'CYP2D6',
      allele: 'Normal metabolizer',
      recommendation: 'Standard dosing',
      risk: 'Low',
    },
    {
      gene: 'CYP2D6',
      allele: 'Poor metabolizer',
      recommendation: 'Use alternative analgesic',
      risk: 'High',
    },
    {
      gene: 'CYP2D6',
      allele: 'Ultra-rapid metabolizer',
      recommendation: 'Higher dose may be needed',
      risk: 'High',
    },
  ],
  Omeprazole: [
    {
      gene: 'CYP2C19',
      allele: '*1/*1',
      recommendation: 'Standard dosing',
      risk: 'Low',
    },
    {
      gene: 'CYP2C19',
      allele: 'Poor metabolizer',
      recommendation: 'Use lower dose',
      risk: 'Medium',
    },
  ],
  Metoprolol: [
    {
      gene: 'CYP2D6',
      allele: 'Normal metabolizer',
      recommendation: 'Standard dosing',
      risk: 'Low',
    },
    {
      gene: 'CYP2D6',
      allele: 'Poor metabolizer',
      recommendation: 'Reduce dose',
      risk: 'Medium',
    },
  ],
  Tamoxifen: [
    {
      gene: 'CYP2D6',
      allele: 'Normal metabolizer',
      recommendation: 'Standard therapy',
      risk: 'Low',
    },
    {
      gene: 'CYP2D6',
      allele: 'Poor metabolizer',
      recommendation: 'Consider aromatase inhibitor',
      risk: 'High',
    },
  ],
};

export default function Home() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    // Get interactions for all medications
    const allInteractions: DrugInteraction[] = [];
    patient.medications.forEach((medication) => {
      const interactions = DRUG_GENE_DATABASE[medication] || [];
      allInteractions.push(...interactions);
    });
    setInteractions(allInteractions);
  };

  const filteredPatients = MOCK_PATIENTS.filter((patient) =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const highRiskCount = interactions.filter((i) => i.risk === 'High').length;
  const mediumRiskCount = interactions.filter((i) => i.risk === 'Medium').length;

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Dashboard Stats */}
        {selectedPatient && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-900 border border-border rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Patient
                  </p>
                  <p className="text-lg font-semibold mt-1">
                    {selectedPatient.name}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-border rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Medications
                  </p>
                  <p className="text-lg font-semibold mt-1">
                    {selectedPatient.medications.length}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-border rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Risk Alerts
                  </p>
                  <p className="text-lg font-semibold mt-1">
                    {highRiskCount + mediumRiskCount}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Patient Search */}
          <div>
            <PatientSearch
              patients={filteredPatients}
              selectedPatient={selectedPatient}
              onPatientSelect={handlePatientSelect}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          {/* Drug-Gene Interactions */}
          <div>
            {selectedPatient ? (
              <DrugGeneInteractions
                patient={selectedPatient}
                interactions={interactions}
              />
            ) : (
              <div className="bg-white dark:bg-gray-900 border border-border rounded-lg p-8 text-center shadow-sm">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Select a patient to view drug-gene interactions
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
