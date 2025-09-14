// components/Registrations/forms/MedicalHistoryForm.tsx

import React from 'react';
import { useRegistration } from '../../../context/RegistrationContext';
import FormButtons from '../common/FormButtons';
import FileUpload from '../common/FileUpload';

const MedicalHistoryForm: React.FC = () => {
  const { state, updateMedicalHistory, nextStep, prevStep } = useRegistration();
  const { medicalHistory } = state.formData;

  const handleInputChange = (field: string, value: string) => {
    updateMedicalHistory({ [field]: value });
  };

  const handleFileChange = (field: string, files: File[]) => {
    updateMedicalHistory({ [field]: files });
  };

  const handleNext = () => {
    // Add validation logic here
    nextStep();
  };

  const handlePrevious = () => {
    prevStep();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Book Appointment</h2>
      
      <div className="space-y-6">
        {/* Clinical Summary */}
        <div>
          <label htmlFor="clinicalSummary" className="block text-sm font-medium text-gray-700 mb-1">
            Clinical Summary / Treatment History
          </label>
          <textarea
            id="clinicalSummary"
            value={medicalHistory.clinicalSummary}
            onChange={(e) => handleInputChange('clinicalSummary', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Please provide details about your medical history, current symptoms, previous treatments, etc."
          />
        </div>

        {/* Pathology Upload */}
        <FileUpload
          label="Pathology"
          accept=".pdf,.jpg,.jpeg,.png"
          maxSize={10}
          files={medicalHistory.pathologyFiles}
          onFilesChange={(files) => handleFileChange('pathologyFiles', files)}
          placeholder="Drop your file here, or Browse"
        />

        {/* Imageology Upload */}
        <FileUpload
          label="Imageology"
          accept=".pdf,.jpg,.jpeg,.png,.dcm"
          maxSize={10}
          files={medicalHistory.imageologyFiles}
          onFilesChange={(files) => handleFileChange('imageologyFiles', files)}
          placeholder="Drop your file here, or Browse"
        />
      </div>

      <FormButtons
        onCancel={() => window.history.back()}
        onNext={handleNext}
        onPrevious={handlePrevious}
        nextLabel="Next"
        previousLabel="Previous"
        showPrevious={true}
      />
    </div>
  );
};

export default MedicalHistoryForm;