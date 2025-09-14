export interface PersonalInfo {
  name: string;
  phone: string;
  email: string;
  date_of_birth?: string;
  gender: string;
  address: string;
  patientId?: string;
  isAlreadyRegistered?: boolean;
  age?: string;
  consultation_price?: string;
  slot_duration_minutes?: number;
  is_inr?: boolean;
}

export interface MedicalHistory {
  clinicalSummary: string;
  pathologyFiles: File[];
  imageologyFiles: File[];
}

export interface AdditionalDetails {
  additionalNotes: string;
  additionalAttachments: File[];
}

export interface AppointmentSchedule {
  selectedDate: string;
  selectedTimeSlot: string;
  availableSlots: TimeSlot[];
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  scheduleId?: string;
}

export interface RegistrationFormData {
  personalInfo: PersonalInfo;
  medicalHistory: MedicalHistory;
  additionalDetails: AdditionalDetails;
  appointmentSchedule: AppointmentSchedule;
}

export interface FormStep {
  id: number;
  title: string;
  component: React.ComponentType;
  isCompleted: boolean;
  isValid: boolean;
}

export interface FileUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadedFiles: UploadedFile[];
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface RegistrationState {
  currentStep: number;
  formData: RegistrationFormData;
  errors: ValidationErrors;
  isSubmitting: boolean;
  fileUploadState: FileUploadState;
}