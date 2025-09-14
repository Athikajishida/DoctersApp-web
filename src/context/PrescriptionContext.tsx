// context/PrescriptionContext.tsx
import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { PrescriptionFormData, PrescriptionNote, PrescriptionContextType } from '../types/prescription.types.ts';
import { prescriptionService } from '../services/prescriptionService';

interface PrescriptionState {
  prescriptionData: PrescriptionFormData;
  prescriptionNotes: PrescriptionNote[];
  isLoading: boolean;
  error: string | null;
  currentAppointmentId: number | null;
}

type PrescriptionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PRESCRIPTION_DATA'; payload: Partial<PrescriptionFormData> }
  | { type: 'SET_PRESCRIPTION_NOTES'; payload: PrescriptionNote[] }
  | { type: 'ADD_PRESCRIPTION_NOTE'; payload: PrescriptionNote }
  | { type: 'UPDATE_PRESCRIPTION_NOTE'; payload: { id: number; note: Partial<PrescriptionNote> } }
  | { type: 'DELETE_PRESCRIPTION_NOTE'; payload: number }
  | { type: 'CLEAR_PRESCRIPTION' }
  | { type: 'SET_APPOINTMENT_ID'; payload: number | null };

const initialState: PrescriptionState = {
  prescriptionData: {
    treatmentHistory: '',
    surgery: '',
    chemo: '',
    radiation: '',
    immunotherapy: '',
    others: '',
    diagnosis: '',
    instructions: '',
    finalDiagnosis: '',
    advice: ''
  },
  prescriptionNotes: [],
  isLoading: false,
  error: null,
  currentAppointmentId: null
};

const prescriptionReducer = (state: PrescriptionState, action: PrescriptionAction): PrescriptionState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PRESCRIPTION_DATA':
      return { 
        ...state, 
        prescriptionData: { ...state.prescriptionData, ...action.payload } 
      };
    case 'SET_PRESCRIPTION_NOTES':
      return { ...state, prescriptionNotes: action.payload };
    case 'ADD_PRESCRIPTION_NOTE':
      return { 
        ...state, 
        prescriptionNotes: [...state.prescriptionNotes, action.payload] 
      };
    case 'UPDATE_PRESCRIPTION_NOTE':
      return {
        ...state,
        prescriptionNotes: state.prescriptionNotes.map(note =>
          note.id === action.payload.id 
            ? { ...note, ...action.payload.note }
            : note
        )
      };
    case 'DELETE_PRESCRIPTION_NOTE':
      return {
        ...state,
        prescriptionNotes: state.prescriptionNotes.filter(note => note.id !== action.payload)
      };
    case 'CLEAR_PRESCRIPTION':
      return initialState;
    case 'SET_APPOINTMENT_ID':
      return { ...state, currentAppointmentId: action.payload };
    default:
      return state;
  }
};

const PrescriptionContext = createContext<PrescriptionContextType | undefined>(undefined);

interface PrescriptionProviderProps {
  children: ReactNode;
}

export const PrescriptionProvider: React.FC<PrescriptionProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(prescriptionReducer, initialState);

  const updatePrescriptionData = useCallback((data: Partial<PrescriptionFormData>) => {
    dispatch({ type: 'SET_PRESCRIPTION_DATA', payload: data });
  }, []);

  const savePrescription = useCallback(async (appointmentId: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const prescriptions = Object.entries(state.prescriptionData)
        .filter(([_, value]) => value.trim() !== '')
        .map(([key, value]) => ({
          prescription: key,
          details: value
        }));

      if (prescriptions.length === 0) {
        throw new Error('No prescription data to save');
      }

      const response = state.prescriptionNotes.length > 0
        ? await prescriptionService.updatePrescriptionNotes(appointmentId, prescriptions)
        : await prescriptionService.createPrescriptionNotes(appointmentId, prescriptions);

      dispatch({ type: 'SET_PRESCRIPTION_NOTES', payload: response.data });
      dispatch({ type: 'SET_APPOINTMENT_ID', payload: appointmentId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to save prescription' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.prescriptionData, state.prescriptionNotes.length]);

  const loadPrescription = useCallback(async (appointmentId: number) => {
  dispatch({ type: 'SET_LOADING', payload: true });
  dispatch({ type: 'SET_ERROR', payload: null });

  try {
    const notes = await prescriptionService.getPrescriptionNotes(appointmentId);
    dispatch({ type: 'SET_PRESCRIPTION_NOTES', payload: notes || [] });
    dispatch({ type: 'SET_APPOINTMENT_ID', payload: appointmentId });

    // Convert notes back to form data
    const formData: Partial<PrescriptionFormData> = {};
    if (notes && notes.length > 0) {
      notes.forEach(note => {
        if (note.prescription && note.details) {
          (formData as any)[note.prescription] = note.details;
        }
      });
    }
    dispatch({ type: 'SET_PRESCRIPTION_DATA', payload: formData });
  } catch (error) {
    // Only set error for non-404 errors
    if (error instanceof Error && !error.message.includes('404')) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
    
    // Always set appointment ID and empty data for graceful handling
    dispatch({ type: 'SET_PRESCRIPTION_NOTES', payload: [] });
    dispatch({ type: 'SET_APPOINTMENT_ID', payload: appointmentId });
    dispatch({ type: 'SET_PRESCRIPTION_DATA', payload: {} });
    
    console.warn(`Could not load prescription notes for appointment ${appointmentId}:`, error);
  } finally {
    dispatch({ type: 'SET_LOADING', payload: false });
  }
}, []);

  const clearPrescription = useCallback(() => {
    dispatch({ type: 'CLEAR_PRESCRIPTION' });
  }, []);

  const addPrescriptionNote = useCallback(async (note: Omit<PrescriptionNote, 'id'>) => {
    if (!state.currentAppointmentId) {
      throw new Error('No appointment selected');
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await prescriptionService.createPrescriptionNotes(
        state.currentAppointmentId,
        [{ prescription: note.prescription, details: note.details }]
      );
      dispatch({ type: 'SET_PRESCRIPTION_NOTES', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add prescription note' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentAppointmentId]);

  const updatePrescriptionNote = useCallback(async (id: number, note: Partial<PrescriptionNote>) => {
    if (!state.currentAppointmentId) {
      throw new Error('No appointment selected');
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const updatedNotes = state.prescriptionNotes.map(n => 
        n.id === id ? { ...n, ...note } : n
      );
      const prescriptions = updatedNotes.map(n => ({
        prescription: n.prescription,
        details: n.details
      }));
      
      const response = await prescriptionService.updatePrescriptionNotes(
        state.currentAppointmentId,
        prescriptions
      );
      dispatch({ type: 'SET_PRESCRIPTION_NOTES', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update prescription note' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentAppointmentId, state.prescriptionNotes]);

  const deletePrescriptionNote = useCallback(async (id: number) => {
    if (!state.currentAppointmentId) {
      throw new Error('No appointment selected');
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const remainingNotes = state.prescriptionNotes.filter(n => n.id !== id);
      if (remainingNotes.length === 0) {
        await prescriptionService.deletePrescriptionNotes(state.currentAppointmentId);
        dispatch({ type: 'SET_PRESCRIPTION_NOTES', payload: [] });
      } else {
        const prescriptions = remainingNotes.map(n => ({
          prescription: n.prescription,
          details: n.details
        }));
        const response = await prescriptionService.updatePrescriptionNotes(
          state.currentAppointmentId,
          prescriptions
        );
        dispatch({ type: 'SET_PRESCRIPTION_NOTES', payload: response.data });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete prescription note' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentAppointmentId, state.prescriptionNotes]);

  const value: PrescriptionContextType = {
    prescriptionData: state.prescriptionData,
    prescriptionNotes: state.prescriptionNotes,
    isLoading: state.isLoading,
    error: state.error,
    updatePrescriptionData,
    savePrescription,
    loadPrescription,
    clearPrescription,
    addPrescriptionNote,
    updatePrescriptionNote,
    deletePrescriptionNote
  };

  return (
    <PrescriptionContext.Provider value={value}>
      {children}
    </PrescriptionContext.Provider>
  );
};

export const usePrescription = (): PrescriptionContextType => {
  const context = useContext(PrescriptionContext);
  if (!context) {
    throw new Error('usePrescription must be used within a PrescriptionProvider');
  }
  return context;
};