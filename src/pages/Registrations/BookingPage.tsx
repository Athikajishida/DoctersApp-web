// pages/Registrations/BookingPage.tsx

import React from 'react';
import { RegistrationProvider } from '../../context/RegistrationContext';
import RegistrationWizard from '../../components/Registrations/RegistrationWizard';

const BookingPage: React.FC = () => {
  return (
    <RegistrationProvider>
      <RegistrationWizard />
    </RegistrationProvider>
  );
};

export default BookingPage;