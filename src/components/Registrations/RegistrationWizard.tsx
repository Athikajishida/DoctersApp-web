// components/Registrations/RegistrationWizard.tsx

import React from 'react';
import { useRegistration } from '../../context/RegistrationContext';
import FormLayout from './common/FormLayout';
import StepIndicator from './common/StepIndicator';
import PersonalInfoForm from './forms/PersonalInfoForm';
import MedicalHistoryForm from './forms/MedicalHistoryForm';
import AdditionalDetailsForm from './forms/AdditionalDetailsForm';
import AppointmentScheduleForm from './forms/AppointmentScheduleForm';

const RegistrationWizard: React.FC = () => {
  const { state } = useRegistration();

  const steps = [
    {
      id: 1,
      title: 'Personal Information',
      component: PersonalInfoForm
    },
    {
      id: 2,
      title: 'Medical History',
      component: MedicalHistoryForm
    },
    {
      id: 3,
      title: 'Additional Details',
      component: AdditionalDetailsForm
    },
    {
      id: 4,
      title: 'Schedule Appointment',
      component: AppointmentScheduleForm
    }
  ];

  const currentStepData = steps.find(step => step.id === state.currentStep);
  const CurrentStepComponent = currentStepData?.component;

  return (
    <div className="min-h-screen bg-gray-600 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-6">Booking Form</h1>
          <StepIndicator 
            steps={steps} 
            currentStep={state.currentStep} 
          />
        </div>

        <FormLayout>
          {CurrentStepComponent && <CurrentStepComponent />}
        </FormLayout>
      </div>
    </div>
  );
};

export default RegistrationWizard;