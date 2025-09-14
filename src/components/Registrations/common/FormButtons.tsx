// components/Registrations/common/FormButtons.tsx

import React from 'react';

interface FormButtonsProps {
  onCancel: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  nextLabel?: string;
  previousLabel?: string;
  cancelLabel?: string;
  showPrevious?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  disabled?: boolean;
}

const FormButtons: React.FC<FormButtonsProps> = ({
  onCancel,
  onNext,
  onPrevious,
  nextLabel = "Next",
  previousLabel = "Previous",
  cancelLabel = "Cancel",
  showPrevious = true,
  isLoading = false,
  loadingText = "Loading...",
  disabled = false
}) => {
  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          {cancelLabel}
        </button>
        
        {showPrevious && onPrevious && (
          <button
            type="button"
            onClick={onPrevious}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            {previousLabel}
          </button>
        )}
      </div>

      {onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={disabled || isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{loadingText}</span>
            </div>
          ) : (
            nextLabel
          )}
        </button>
      )}
    </div>
  );
};

export default FormButtons;