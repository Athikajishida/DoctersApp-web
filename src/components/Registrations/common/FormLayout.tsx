// components/Registrations/common/FormLayout.tsx

import React, { ReactNode } from 'react';

interface FormLayoutProps {
  children: ReactNode;
}

const FormLayout: React.FC<FormLayoutProps> = ({ children }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {children}
    </div>
  );
};

export default FormLayout;