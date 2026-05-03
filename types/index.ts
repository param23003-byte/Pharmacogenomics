export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  medications: string[];
}

export interface DrugInteraction {
  gene: string;
  allele: string;
  recommendation: string;
  risk: 'Low' | 'Medium' | 'High';
}

export interface GeneticProfile {
  gene: string;
  variants: string[];
}
