// context/RegistrationContext.tsx

import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type {
  RegistrationState,
  ValidationErrors,
  FileUploadState,
  PersonalInfo,
  MedicalHistory,
  AdditionalDetails,
  AppointmentSchedule
} from '../types/registration';

// Initial state
const initialState: RegistrationState = {
  currentStep: 1,
  formData: {
    personalInfo: {
      name: '',
      phone: '',
      email: '',
      age: '',
      gender: '',
      address: '',
      patientId: undefined,
      isAlreadyRegistered: undefined,
      is_inr: undefined,
    },
    medicalHistory: {
      clinicalSummary: '',
      pathologyFiles: [],
      imageologyFiles: []
    },
    additionalDetails: {
      additionalNotes: '',
      additionalAttachments: []
    },
    appointmentSchedule: {
      selectedDate: '',
      selectedTimeSlot: '',
      availableSlots: []
    }
  },
  errors: {},
  isSubmitting: false,
  fileUploadState: {
    isUploading: false,
    progress: 0,
    error: null,
    uploadedFiles: []
  }
};

// Action types
type RegistrationAction = 
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'UPDATE_PERSONAL_INFO'; payload: Partial<PersonalInfo> }
  | { type: 'UPDATE_MEDICAL_HISTORY'; payload: Partial<MedicalHistory> }
  | { type: 'UPDATE_ADDITIONAL_DETAILS'; payload: Partial<AdditionalDetails> }
  | { type: 'UPDATE_APPOINTMENT_SCHEDULE'; payload: Partial<AppointmentSchedule> }
  | { type: 'SET_ERRORS'; payload: ValidationErrors }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'UPDATE_FILE_UPLOAD_STATE'; payload: Partial<FileUploadState> }
  | { type: 'RESET_FORM' };

// Reducer
const registrationReducer = (state: RegistrationState, action: RegistrationAction): RegistrationState => {
  switch (action.type) {
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    
    case 'UPDATE_PERSONAL_INFO':
      return {
        ...state,
        formData: {
          ...state.formData,
          personalInfo: { ...state.formData.personalInfo, ...action.payload }
        }
      };
    
    case 'UPDATE_MEDICAL_HISTORY':
      return {
        ...state,
        formData: {
          ...state.formData,
          medicalHistory: { ...state.formData.medicalHistory, ...action.payload }
        }
      };
    
    case 'UPDATE_ADDITIONAL_DETAILS':
      return {
        ...state,
        formData: {
          ...state.formData,
          additionalDetails: { ...state.formData.additionalDetails, ...action.payload }
        }
      };
    
    case 'UPDATE_APPOINTMENT_SCHEDULE':
      return {
        ...state,
        formData: {
          ...state.formData,
          appointmentSchedule: { ...state.formData.appointmentSchedule, ...action.payload }
        }
      };
    
    case 'SET_ERRORS':
      return { ...state, errors: action.payload };
    
    case 'CLEAR_ERRORS':
      return { ...state, errors: {} };
    
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    
    case 'UPDATE_FILE_UPLOAD_STATE':
      return {
        ...state,
        fileUploadState: { ...state.fileUploadState, ...action.payload }
      };
    
    case 'RESET_FORM':
      return initialState;
    
    default:
      return state;
  }
};

// Context
interface RegistrationContextType {
  state: RegistrationState;
  dispatch: React.Dispatch<RegistrationAction>;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  updatePersonalInfo: (data: Partial<PersonalInfo>) => void;
  updateMedicalHistory: (data: Partial<MedicalHistory>) => void;
  updateAdditionalDetails: (data: Partial<AdditionalDetails>) => void;
  updateAppointmentSchedule: (data: Partial<AppointmentSchedule>) => void;
  setErrors: (errors: ValidationErrors) => void;
  clearErrors: () => void;
  resetForm: () => void;
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

// Provider
interface RegistrationProviderProps {
  children: ReactNode;
}

export const RegistrationProvider: React.FC<RegistrationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(registrationReducer, initialState);

  const nextStep = () => {
    if (state.currentStep < 4) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStep + 1 });
    }
  };

  const prevStep = () => {
    if (state.currentStep > 1) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStep - 1 });
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 4) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: step });
    }
  };

  const updatePersonalInfo = (data: Partial<PersonalInfo>) => {
    dispatch({ type: 'UPDATE_PERSONAL_INFO', payload: data });
  };

  const updateMedicalHistory = (data: Partial<MedicalHistory>) => {
    dispatch({ type: 'UPDATE_MEDICAL_HISTORY', payload: data });
  };

  const updateAdditionalDetails = (data: Partial<AdditionalDetails>) => {
    dispatch({ type: 'UPDATE_ADDITIONAL_DETAILS', payload: data });
  };

  const updateAppointmentSchedule = (data: Partial<AppointmentSchedule>) => {
    dispatch({ type: 'UPDATE_APPOINTMENT_SCHEDULE', payload: data });
  };

  const setErrors = (errors: ValidationErrors) => {
    dispatch({ type: 'SET_ERRORS', payload: errors });
  };

  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ERRORS' });
  };

  const resetForm = () => {
    dispatch({ type: 'RESET_FORM' });
  };

  const value: RegistrationContextType = {
    state,
    dispatch,
    nextStep,
    prevStep,
    goToStep,
    updatePersonalInfo,
    updateMedicalHistory,
    updateAdditionalDetails,
    updateAppointmentSchedule,
    setErrors,
    clearErrors,
    resetForm
  };

  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
};

// Hook
export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (context === undefined) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
};