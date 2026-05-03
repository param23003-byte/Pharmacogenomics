'use client';

import { Search, User, Calendar, Users, Pill } from 'lucide-react';
import { Patient } from '@/types';

interface PatientSearchProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onPatientSelect: (patient: Patient) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function PatientSearch({
  patients,
  selectedPatient,
  onPatientSelect,
  searchQuery,
  onSearchChange,
}: PatientSearchProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-border rounded-lg shadow-sm overflow-hidden">
      {/* Search Input */}
      <div className="p-6 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients by name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800 text-foreground"
          />
        </div>
      </div>

      {/* Patient List */}
      <div className="divide-y divide-border max-h-96 overflow-y-auto">
        {patients.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No patients found
          </div>
        ) : (
          patients.map((patient) => (
            <button
              key={patient.id}
              onClick={() => onPatientSelect(patient)}
              className={`w-full p-4 text-left transition-colors ${
                selectedPatient?.id === patient.id
                  ? 'bg-primary/10 border-l-4 border-primary'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      {patient.name}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{patient.age} years</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{patient.gender}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-start gap-1">
                    <Pill className="w-3 h-3 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {patient.medications.join(', ')}
                    </span>
                  </div>
                </div>

                {selectedPatient?.id === patient.id && (
                  <div className="w-2 h-2 bg-primary rounded-full mt-1" />
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Summary Footer */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 border-t border-border">
        {patients.length} patient{patients.length !== 1 ? 's' : ''} available
      </div>
    </div>
  );
}
