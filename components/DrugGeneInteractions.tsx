'use client';

import { AlertTriangle, CheckCircle, AlertCircle, Pill } from 'lucide-react';
import { Patient, DrugInteraction } from '@/types';

interface DrugGeneInteractionsProps {
  patient: Patient;
  interactions: DrugInteraction[];
}

export default function DrugGeneInteractions({
  patient,
  interactions,
}: DrugGeneInteractionsProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High':
        return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
      case 'Medium':
        return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800';
      case 'Low':
        return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'High':
        return (
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
        );
      case 'Medium':
        return (
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        );
      case 'Low':
        return (
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
        );
      default:
        return null;
    }
  };

  const getRiskTextColor = (risk: string) => {
    switch (risk) {
      case 'High':
        return 'text-red-700 dark:text-red-300';
      case 'Medium':
        return 'text-yellow-700 dark:text-yellow-300';
      case 'Low':
        return 'text-green-700 dark:text-green-300';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-border rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center gap-2 mb-2">
          <Pill className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">
            Drug-Gene Interactions
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {patient.medications.length} medication{patient.medications.length !== 1 ? 's' : ''} ·{' '}
          {interactions.length} interaction{interactions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Interactions List */}
      <div className="divide-y divide-border max-h-96 overflow-y-auto">
        {interactions.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No drug-gene interactions found
          </div>
        ) : (
          interactions.map((interaction, index) => (
            <div
              key={`${interaction.gene}-${interaction.allele}-${index}`}
              className={`p-4 border-l-4 transition-colors ${getRiskColor(interaction.risk)}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">{getRiskIcon(interaction.risk)}</div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {interaction.gene}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Allele: {interaction.allele}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskTextColor(interaction.risk)}`}
                    >
                      {interaction.risk} Risk
                    </span>
                  </div>

                  <div className="mt-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-foreground mb-1">
                      Recommendation:
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {interaction.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {interactions.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <p className="text-gray-600 dark:text-gray-400">High Risk</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                {interactions.filter((i) => i.risk === 'High').length}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Medium Risk</p>
              <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                {interactions.filter((i) => i.risk === 'Medium').length}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Low Risk</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {interactions.filter((i) => i.risk === 'Low').length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
