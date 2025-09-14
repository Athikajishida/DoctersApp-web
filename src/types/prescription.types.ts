// types/prescription.ts
export interface PrescriptionNote {
  id?: number;
  prescription: string;
  details: string;
  appointment_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PrescriptionSection {
  id: string;
  label: string;
  content: string;
  placeholder?: string;
}

export interface PrescriptionFormData {
  treatmentHistory: string;
  surgery: string;
  chemo: string;
  radiation: string;
  immunotherapy: string;
  others: string;
  diagnosis: string;
  instructions: string;
  finalDiagnosis: string;
  advice: string;
}

export interface PrescriptionContextType {
  prescriptionData: PrescriptionFormData;
  prescriptionNotes: PrescriptionNote[];
  isLoading: boolean;
  error: string | null;
  updatePrescriptionData: (data: Partial<PrescriptionFormData>) => void;
  savePrescription: (appointmentId: number) => Promise<void>;
  loadPrescription: (appointmentId: number) => Promise<void>;
  clearPrescription: () => void;
  addPrescriptionNote: (note: Omit<PrescriptionNote, 'id'>) => Promise<void>;
  updatePrescriptionNote: (id: number, note: Partial<PrescriptionNote>) => Promise<void>;
  deletePrescriptionNote: (id: number) => Promise<void>;
}

export interface PrescriptionApiResponse {
  message: string;
  data: PrescriptionNote[];
  pdf_link?: string;
}

export interface PrescriptionApiError {
  error: string[] | string;
}

export const PRESCRIPTION_SECTIONS: PrescriptionSection[] = [
  {
    id: 'treatmentHistory',
    label: 'Treatment History',
    content: '',
    placeholder: 'An after-visit summary that provides a patient with relevant and actionable information and instructions containing the patient name, provider\'s office contact information, date and location of visit, an updated medication list, updated vitals, reason(s) for visit'
  },
  {
    id: 'surgery',
    label: 'Surgery',
    content: '',
    placeholder: 'Enter surgery details...'
  },
  {
    id: 'chemo',
    label: 'Chemo',
    content: '',
    placeholder: 'Enter chemotherapy details...'
  },
  {
    id: 'radiation',
    label: 'Radiation',
    content: '',
    placeholder: 'Enter radiation therapy details...'
  },
  {
    id: 'immunotherapy',
    label: 'Immunotherapy',
    content: '',
    placeholder: 'Enter immunotherapy details...'
  },
  {
    id: 'others',
    label: 'Others',
    content: '',
    placeholder: 'Enter other treatment details...'
  },
  {
    id: 'diagnosis',
    label: 'Diagnosis',
    content: '',
    placeholder: 'Enter diagnosis details...'
  },
  {
    id: 'instructions',
    label: 'Instructions',
    content: '',
    placeholder: 'Enter patient instructions...'
  },
  {
    id: 'finalDiagnosis',
    label: 'Final Diagnosis',
    content: '',
    placeholder: 'Enter final diagnosis...'
  },
  {
    id: 'advice',
    label: 'Advice',
    content: '',
    placeholder: 'Enter medical advice...'
  }
];