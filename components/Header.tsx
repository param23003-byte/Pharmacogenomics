'use client';

import { User } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-border bg-white dark:bg-gray-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Pharmacogenomics
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Patient Management & Drug-Gene Interaction Analysis
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-primary">v1.0.0</p>
        </div>
      </div>
    </header>
  );
}
