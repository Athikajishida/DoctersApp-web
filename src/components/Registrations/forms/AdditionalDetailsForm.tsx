// components/Registrations/forms/AdditionalDetailsForm.tsx

import React from 'react';
import { useRegistration } from '../../../context/RegistrationContext';
import FormButtons from '../common/FormButtons';
import FileUpload from '../common/FileUpload';

const AdditionalDetailsForm: React.FC = () => {
  const { state, updateAdditionalDetails, nextStep, prevStep } = useRegistration();
  const { additionalDetails } = state.formData;

  const handleInputChange = (field: string, value: string) => {
    updateAdditionalDetails({ [field]: value });
  };

  const handleFileChange = (field: string, files: File[]) => {
    updateAdditionalDetails({ [field]: files });
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
        {/* Additional Details */}
        <div>
          <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Details
          </label>
          <textarea
            id="additionalNotes"
            value={additionalDetails.additionalNotes}
            onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Any additional information you'd like to share (allergies, medications, special requirements, etc.)"
          />
        </div>

        {/* Additional Attachments */}
        <FileUpload
          label="Additional Attachments"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          maxSize={10}
          files={additionalDetails.additionalAttachments}
          onFilesChange={(files) => handleFileChange('additionalAttachments', files)}
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

export default AdditionalDetailsForm;