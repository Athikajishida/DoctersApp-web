// components/Registrations/common/StepIndicator.tsx

import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

interface Step {
  id: number;
  title: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full mb-2">
              {step.id < currentStep ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : step.id === currentStep ? (
                <Circle className="w-8 h-8 text-blue-500 fill-current" />
              ) : (
                <Circle className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <span className={`text-sm font-medium ${
              step.id <= currentStep ? 'text-white' : 'text-gray-400'
            }`}>
              {step.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-16 h-0.5 mx-4 ${
              step.id < currentStep ? 'bg-green-500' : 'bg-gray-400'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;