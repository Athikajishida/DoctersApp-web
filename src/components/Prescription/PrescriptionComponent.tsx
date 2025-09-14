import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Save, X, Plus, Trash2, Edit3, ArrowLeft, AlertCircle, CheckCircle, Send } from 'lucide-react';
import { usePrescription } from '../../context/PrescriptionContext';
import { useToast } from '../../context/ToastContext';
import Header from '../layouts/Header';
import { prescriptionService } from '../../services/prescriptionService';
// Types
interface PrescriptionNote {
  id?: number;
  prescription: string;
  details: string;
  appointment_id?: number;
  created_at?: string;
  updated_at?: string;
}

interface PrescriptionComponentProps {
  appointmentId?: number;
  onSave?: () => void;
  onCancel?: () => void;
}

const PrescriptionComponent: React.FC<PrescriptionComponentProps> = ({
  appointmentId,
  onSave,
  onCancel
}) => {
  const {
    prescriptionData,
    prescriptionNotes,
    isLoading,
    error,
    updatePrescriptionData,
    savePrescription,
    loadPrescription,
    clearPrescription,
    addPrescriptionNote,
    updatePrescriptionNote,
    deletePrescriptionNote
  } = usePrescription();

  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [newNote, setNewNote] = useState({ prescription: '', details: '' });
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [customFields, setCustomFields] = useState<Array<{id: string, label: string, value: string}>>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingPrescriptions, setExistingPrescriptions] = useState<Map<string, PrescriptionNote>>(new Map());

  // Default prescription fields - moved to useMemo to prevent recreation
  const defaultFields = useMemo(() => [
    { key: 'treatmentHistory', label: 'Treatment History' },
    { key: 'surgery', label: 'Surgery' },
    { key: 'chemo', label: 'Chemo' },
    { key: 'radiation', label: 'Radiation' },
    { key: 'immunotherapy', label: 'Immunotherapy' },
    { key: 'others', label: 'Others' },
    { key: 'diagnosis', label: 'Diagnosis' },
    { key: 'instructions', label: 'Instructions' },
    { key: 'finalDiagnosis', label: 'Final Diagnosis' },
    { key: 'advice', label: 'Advice' }
  ], []);

  // Load existing prescription data when component mounts or appointmentId changes
  useEffect(() => {
    if (appointmentId) {
      loadPrescription(appointmentId).catch(() => {
        clearPrescription();
        setIsEditMode(false);
        setExistingPrescriptions(new Map());
        setCustomFields([]);
      });
    }
    
    return () => {
      clearPrescription();
    };
  }, [appointmentId]); // Removed loadPrescription and clearPrescription from dependencies

  // Check for existing prescriptions and set up edit mode - memoized to prevent recreation
  const checkExistingPrescriptions = useCallback(() => {
    if (prescriptionNotes && prescriptionNotes.length > 0) {
      const prescriptionMap = new Map<string, PrescriptionNote>();
      let hasMainPrescriptions = false;
      const customFieldsData: Array<{id: string, label: string, value: string}> = [];

      // Group prescriptions by their type (prescription field)
      prescriptionNotes.forEach(note => {
        // Check if this is one of the main prescription fields
        const isMainField = defaultFields.some(field => field.key === note.prescription);
        if (isMainField) {
          hasMainPrescriptions = true;
          // Keep only the most recent prescription for each type
          if (!prescriptionMap.has(note.prescription) || 
              (note.updated_at && prescriptionMap.get(note.prescription)?.updated_at && 
               new Date(note.updated_at) > new Date(prescriptionMap.get(note.prescription)!.updated_at!))) {
            prescriptionMap.set(note.prescription, note);
          }
        } else {
          // This is a custom field - add it to custom fields
          customFieldsData.push({
            id: `custom-${note.id || Date.now()}`,
            label: note.prescription,
            value: note.details
          });
        }
      });

      setExistingPrescriptions(prescriptionMap);
      setCustomFields(customFieldsData);
      setIsEditMode(hasMainPrescriptions || customFieldsData.length > 0);

      // Populate form with existing data
      if (hasMainPrescriptions) {
        const updatedData: any = {};
        prescriptionMap.forEach((note, key) => {
          updatedData[key] = note.details;
        });
        // Update prescription data with existing values
        Object.keys(updatedData).forEach(key => {
          updatePrescriptionData({ [key]: updatedData[key] });
        });
      }
    } else {
      setIsEditMode(false);
      setExistingPrescriptions(new Map());
      setCustomFields([]);
    }
  }, [prescriptionNotes, defaultFields]); // Removed updatePrescriptionData from dependencies

  // Re-check when prescriptionNotes change
  useEffect(() => {
    checkExistingPrescriptions();
  }, [prescriptionNotes, defaultFields]); // Removed checkExistingPrescriptions from dependencies

  // Handle form field changes
  const handleFieldChange = useCallback((field: string, value: string) => {
    updatePrescriptionData({ [field]: value });
  }, []); // Removed updatePrescriptionData from dependencies

  // Handle saving prescription using the context method
  const handleSave = useCallback(async () => {
    if (!appointmentId) {
      showToast('No appointment selected', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode) {
        // Prepare all prescription data for bulk update
        const prescriptions: Array<{ prescription: string; details: string }> = [];
        
        // Process default fields
        defaultFields.forEach(field => {
          const fieldValue = prescriptionData[field.key as keyof typeof prescriptionData] as string;
          if (fieldValue && fieldValue.trim()) {
            prescriptions.push({
              prescription: field.key,
              details: fieldValue.trim()
            });
          }
        });

        // Process custom fields
        customFields.forEach(field => {
          if (field.value && field.value.trim()) {
            prescriptions.push({
              prescription: field.label,
              details: field.value.trim()
            });
          }
        });

        // Send all prescriptions in a single API call
        await prescriptionService.updatePrescriptionNotes(appointmentId, prescriptions);
        setSuccessMessage('Prescription updated successfully');
        showToast('Prescription updated successfully', 'success');
      } else {
        // Create new prescriptions
        await savePrescription(appointmentId);
        setSuccessMessage('Prescription saved successfully');
        showToast('Prescription saved successfully', 'success');
        setIsEditMode(true);
      }
      
      setTimeout(() => setSuccessMessage(null), 3000);
      onSave?.();
      
      // Reload to get updated data
      await loadPrescription(appointmentId);
    } catch (error) {
      showToast(isEditMode ? 'Failed to update prescription' : 'Failed to save prescription', 'error');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  }, [
    appointmentId,
    isEditMode,
    prescriptionData,
    customFields,
    defaultFields,
    onSave
  ]); // Removed function dependencies that cause circular updates

  // Handle sending prescription (same as save for now)
  const handleSend = useCallback(async () => {
    await handleSave();
  }, [handleSave]);

  // Add custom field
  const addCustomField = useCallback(() => {
    const newField = {
      id: `custom-${Date.now()}`,
      label: 'Custom Field',
      value: ''
    };
    setCustomFields(prev => [...prev, newField]);
  }, []);

  // Remove custom field
  const removeCustomField = useCallback((id: string) => {
    setCustomFields(prev => prev.filter(field => field.id !== id));
  }, []);

  // Update custom field
  const updateCustomField = useCallback((id: string, updates: Partial<{label: string, value: string}>) => {
    setCustomFields(prev => prev.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  }, []);

  // Handle adding new prescription note using context
  const handleAddNote = useCallback(async () => {
    if (!newNote.prescription.trim() || !newNote.details.trim()) {
      showToast('Please fill in both prescription and details', 'error');
      return;
    }

    try {
      await addPrescriptionNote({
        prescription: newNote.prescription,
        details: newNote.details,
        appointment_id: appointmentId
      });
      setNewNote({ prescription: '', details: '' });
      setIsAddingNote(false);
      showToast('Prescription note added successfully', 'success');
    } catch (error) {
      showToast('Failed to add prescription note', 'error');
    }
  }, [newNote, appointmentId]); // Removed function dependencies

  // Handle updating prescription note using context
  const handleUpdateNote = useCallback(async (id: number, updatedNote: { prescription: string; details: string }) => {
    try {
      await updatePrescriptionNote(id, updatedNote);
      setEditingNoteId(null);
      showToast('Prescription note updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update prescription note', 'error');
    }
  }, []); // Removed function dependencies

  // Handle deleting prescription note using context
  const handleDeleteNote = useCallback(async (id: number) => {
    if (window.confirm('Are you sure you want to delete this prescription note?')) {
      try {
        await deletePrescriptionNote(id);
        showToast('Prescription note deleted successfully', 'success');
      } catch (error) {
        showToast('Failed to delete prescription note', 'error');
      }
    }
  }, []); // Removed function dependencies

  const handleBack = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  // Get additional prescription notes (not main fields) - memoized
  const additionalNotes = useMemo(() => 
    prescriptionNotes.filter(note => 
      !defaultFields.some(field => field.key === note.prescription)
    ), [prescriptionNotes, defaultFields]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading prescription...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header/>
      <div className="bg-white shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Prescription Details
              </button> */}
              {isEditMode && (
                <span className="ml-4 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  Edit Mode
                </span>
              )}
            </div>
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View PDF
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              {successMessage}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Error: {error}
              <button
                onClick={() => {}}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Prescription Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {isEditMode ? 'Edit Prescription' : 'Create New Prescription'}
              </h2>
              {isEditMode && (
                <div className="text-sm text-gray-500">
                  Last updated: {existingPrescriptions.size > 0 && 
                    Array.from(existingPrescriptions.values())[0]?.updated_at &&
                    new Date(Array.from(existingPrescriptions.values())[0].updated_at!).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Default Prescription Fields */}
              {defaultFields.map((field) => {
                const existingNote = existingPrescriptions.get(field.key);
                const fieldValue = prescriptionData[field.key as keyof typeof prescriptionData] as string || '';
                
                return (
                  <div key={field.key} className="border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-4 min-h-[100px]">
                      {/* Left column - Label */}
                      <div className="col-span-1 bg-gray-50 p-4 border-r border-gray-200 flex items-start justify-between">
                        <span className="font-medium text-gray-900 text-sm">{field.label}</span>
                        {existingNote && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            Existing
                          </span>
                        )}
                      </div>
                      
                      {/* Right column - Text area */}
                      <div className="col-span-3 p-4">
                        <textarea
                          className="w-full h-20 border-0 resize-none focus:outline-none text-sm text-gray-700 placeholder-gray-400"
                          value={fieldValue}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={`Enter details for ${field.label.toLowerCase()}...`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Custom Fields */}
              {customFields.map((field) => (
                <div key={field.id} className="border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-4 min-h-[100px]">
                    {/* Left column - Label */}
                    <div className="col-span-1 bg-gray-50 p-4 border-r border-gray-200 flex items-start">
                      <div className="flex items-center justify-between w-full">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                          className="font-medium text-gray-900 text-sm bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                          placeholder="Field name"
                        />
                        <button
                          onClick={() => removeCustomField(field.id)}
                          className="text-red-500 hover:text-red-700 transition-colors ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Right column - Text area */}
                    <div className="col-span-3 p-4">
                      <textarea
                        className="w-full h-20 border-0 resize-none focus:outline-none text-sm text-gray-700 placeholder-gray-400"
                        value={field.value}
                        onChange={(e) => updateCustomField(field.id, { value: e.target.value })}
                        placeholder="Enter details for this field..."
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Field Button */}
              <div className="border border-gray-200 rounded-lg">
                <div className="grid grid-cols-4 min-h-[100px]">
                  <div className="col-span-1 bg-gray-50 p-4 border-r border-gray-200 flex items-center">
                    <button
                      onClick={addCustomField}
                      className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      <span className="font-medium text-sm">Add New Field</span>
                    </button>
                  </div>
                  <div className="col-span-3 p-4 flex items-center">
                    <span className="text-gray-400 text-sm">Click to add a new prescription field</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Prescription Notes (not main fields) */}
        {additionalNotes.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Prescription Notes</h3>
              <div className="space-y-4">
                {additionalNotes.map((note) => (
                  <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                    {editingNoteId === note.id ? (
                      <EditNoteForm
                        note={note}
                        onSave={handleUpdateNote}
                        onCancel={() => setEditingNoteId(null)}
                      />
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{note.prescription}</h4>
                          <p className="text-gray-600 mt-1">{note.details}</p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => setEditingNoteId(note.id!)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id!)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add New Note Section */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Add New Prescription Note</h3>
              <button
                onClick={() => setIsAddingNote(!isAddingNote)}
                className="flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md"
              >
                <Plus size={16} className="mr-2" />
                Add Note
              </button>
            </div>
            
            {isAddingNote && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prescription
                    </label>
                    <input
                      type="text"
                      value={newNote.prescription}
                      onChange={(e) => setNewNote({ ...newNote, prescription: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter prescription name..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Details
                    </label>
                    <textarea
                      value={newNote.details}
                      onChange={(e) => setNewNote({ ...newNote, details: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter prescription details..."
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setIsAddingNote(false);
                      setNewNote({ prescription: '', details: '' });
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNote}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Note
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={handleSave}
            disabled={isSaving || !appointmentId}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update' : 'Save')}
          </button>
          <button
            onClick={handleSend}
            disabled={isSaving || !appointmentId}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSaving ? 'Sending...' : 'Send'}
          </button>
        </div>

        {/* Warning if no appointment selected */}
        {!appointmentId && (
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Please select an appointment to create a prescription.
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">
              {isEditMode ? 'Updating prescription...' : 'Processing prescription...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Edit Note Form Component
interface EditNoteFormProps {
  note: PrescriptionNote;
  onSave: (id: number, updatedNote: { prescription: string; details: string }) => void;
  onCancel: () => void;
}

const EditNoteForm: React.FC<EditNoteFormProps> = ({ note, onSave, onCancel }) => {
  const [editedNote, setEditedNote] = useState({
    prescription: note.prescription,
    details: note.details
  });

  const handleSave = () => {
    if (editedNote.prescription.trim() && editedNote.details.trim() && note.id) {
      onSave(note.id, editedNote);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prescription
        </label>
        <input
          type="text"
          value={editedNote.prescription}
          onChange={(e) => setEditedNote({ ...editedNote, prescription: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Details
        </label>
        <textarea
          value={editedNote.details}
          onChange={(e) => setEditedNote({ ...editedNote, details: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default PrescriptionComponent;