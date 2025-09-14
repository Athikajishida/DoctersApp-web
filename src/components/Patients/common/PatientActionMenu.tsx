import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, Trash2, Eye, Calendar, Phone, Mail } from 'lucide-react';

interface PatientActionMenuProps {
  patient: {
    id: string;
    name: string;
    mobileNumber: string;
    email?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  onScheduleAppointment?: () => void;
}

const PatientActionMenu: React.FC<PatientActionMenuProps> = ({
  patient,
  onEdit,
  onDelete,
  onView,
  onScheduleAppointment
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCall = () => {
    window.open(`tel:${patient.mobileNumber}`, '_self');
    setIsOpen(false);
  };

  const handleEmail = () => {
    if (patient.email) {
      window.open(`mailto:${patient.email}`, '_self');
    }
    setIsOpen(false);
  };

  const menuItems = [
    {
      icon: Eye,
      label: 'View Details',
      onClick: () => {
        onView();
        setIsOpen(false);
      },
      color: 'text-gray-700 hover:text-blue-600'
    },
    {
      icon: Edit,
      label: 'Edit Patient',
      onClick: () => {
        onEdit();
        setIsOpen(false);
      },
      color: 'text-gray-700 hover:text-blue-600'
    },
    ...(onScheduleAppointment ? [{
      icon: Calendar,
      label: 'Schedule Appointment',
      onClick: () => {
        onScheduleAppointment();
        setIsOpen(false);
      },
      color: 'text-gray-700 hover:text-green-600'
    }] : []),
    {
      icon: Phone,
      label: 'Call Patient',
      onClick: handleCall,
      color: 'text-gray-700 hover:text-green-600'
    },
    ...(patient.email ? [{
      icon: Mail,
      label: 'Send Email',
      onClick: handleEmail,
      color: 'text-gray-700 hover:text-blue-600'
    }] : []),
    {
      icon: Trash2,
      label: 'Delete Patient',
      onClick: () => {
        onDelete();
        setIsOpen(false);
      },
      color: 'text-gray-700 hover:text-red-600',
      divider: true
    }
  ];

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Patient actions"
      >
        <MoreVertical className="h-4 w-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <React.Fragment key={index}>
                  {item.divider && <hr className="my-1 border-gray-200" />}
                  <button
                    onClick={item.onClick}
                    className={`group flex items-center w-full px-4 py-2 text-sm transition-colors ${item.color} hover:bg-gray-50`}
                    role="menuitem"
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientActionMenu;