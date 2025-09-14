import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit } from 'lucide-react';

interface ActionMenuProps {
  appointmentId: number;
  patientId?: string;
  slotId?: number;
  onView?: (appointmentId: number) => void;
  onStartMeeting?: (appointmentId: number) => void;
  onReschedule?: (appointmentId: number, patientId: string, slotId: number) => void;
  onEdit?: (appointmentId: number) => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ 
  appointmentId, 
  patientId,
  slotId,
  onView,
  onStartMeeting,
  onReschedule,
  onEdit
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

  const handleAction = (action: string) => {
    switch (action) {
      case 'view':
        onView?.(appointmentId);
        break;
      case 'start':
        onStartMeeting?.(appointmentId);
        break;
      case 'reschedule':
        if (patientId && slotId) {
          onReschedule?.(appointmentId, patientId, slotId);
        }
        break;
      case 'edit':
        onEdit?.(appointmentId);
        break;

      default:
        console.log(`${action} appointment ${appointmentId}`);
    }
    setIsOpen(false);
  };

  const menuItems = [
    {
      label: 'Start Meeting',
      icon: (
        <svg width="14" height="14" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.75721 3.7035C4.82694 3.77315 4.88226 3.85587 4.92001 3.94692C4.95775 4.03797 4.97718 4.13556 4.97718 4.23412C4.97718 4.33269 4.95775 4.43028 4.92001 4.52133C4.88226 4.61238 4.82694 4.69509 4.75721 4.76475C3.63179 5.89036 2.99955 7.4169 2.99955 9.00863C2.99955 10.6003 3.63179 12.1269 4.75721 13.2525C4.82884 13.3217 4.88598 13.4044 4.92529 13.4959C4.96459 13.5875 4.98528 13.6859 4.98615 13.7854C4.98701 13.885 4.96804 13.9838 4.93033 14.076C4.89262 14.1681 4.83693 14.2519 4.76651 14.3223C4.69609 14.3927 4.61235 14.4484 4.52018 14.4861C4.428 14.5238 4.32924 14.5428 4.22966 14.5419C4.13008 14.5411 4.03166 14.5204 3.94016 14.4811C3.84865 14.4418 3.7659 14.3846 3.69671 14.313C0.766461 11.3835 0.766461 6.633 3.69671 3.7035C3.83736 3.5629 4.02809 3.48391 4.22696 3.48391C4.42583 3.48391 4.61657 3.5629 4.75721 3.7035ZM14.3062 3.7035C17.2357 6.63375 17.2357 11.3835 14.3062 14.313C14.1656 14.4537 13.9748 14.5328 13.7759 14.5329C13.5769 14.533 13.3861 14.454 13.2453 14.3134C13.1046 14.1727 13.0255 13.982 13.0254 13.783C13.0254 13.5841 13.1043 13.3932 13.245 13.2525C14.3704 12.1269 15.0026 10.6003 15.0026 9.00863C15.0026 7.4169 14.3704 5.89036 13.245 4.76475C13.1042 4.62402 13.0252 4.43315 13.0252 4.23412C13.0252 4.0351 13.1042 3.84423 13.245 3.7035C13.3857 3.56277 13.5766 3.48371 13.7756 3.48371C13.9746 3.48371 14.1655 3.56277 14.3062 3.7035ZM6.98246 5.859C7.12306 5.99965 7.20205 6.19038 7.20205 6.38925C7.20205 6.58812 7.12306 6.77885 6.98246 6.9195C6.70943 7.19251 6.49284 7.51662 6.34507 7.87334C6.1973 8.23006 6.12125 8.61239 6.12125 8.9985C6.12125 9.38461 6.1973 9.76694 6.34507 10.1237C6.49284 10.4804 6.70943 10.8045 6.98246 11.0775C7.05209 11.1472 7.10732 11.2299 7.14499 11.3209C7.18265 11.4119 7.20202 11.5095 7.20199 11.608C7.20195 11.7065 7.18252 11.8041 7.14478 11.8951C7.10705 11.9861 7.05177 12.0687 6.98209 12.1384C6.9124 12.208 6.82969 12.2632 6.73866 12.3009C6.64764 12.3386 6.55008 12.3579 6.45157 12.3579C6.35306 12.3579 6.25552 12.3384 6.16452 12.3007C6.07352 12.263 5.99084 12.2077 5.92121 12.138C5.08858 11.3053 4.62082 10.176 4.62082 8.9985C4.62082 7.82096 5.08858 6.69166 5.92121 5.859C5.99087 5.78927 6.07358 5.73395 6.16463 5.6962C6.25568 5.65846 6.35327 5.63903 6.45184 5.63903C6.5504 5.63903 6.64799 5.65846 6.73904 5.6962C6.83009 5.73395 6.91281 5.78927 6.98246 5.859ZM12.201 5.859C13.0336 6.69166 13.5014 7.82096 13.5014 8.9985C13.5014 10.176 13.0336 11.3053 12.201 12.138C12.0595 12.2746 11.8701 12.3502 11.6734 12.3485C11.4768 12.3468 11.2887 12.2679 11.1496 12.1289C11.0105 11.9898 10.9317 11.8017 10.93 11.6051C10.9282 11.4084 11.0038 11.219 11.1405 11.0775C11.4135 10.8045 11.6301 10.4804 11.7779 10.1237C11.9256 9.76694 12.0017 9.38461 12.0017 8.9985C12.0017 8.61239 11.9256 8.23006 11.7779 7.87334C11.6301 7.51662 11.4135 7.19251 11.1405 6.9195C11.0038 6.77805 10.9282 6.5886 10.93 6.39195C10.9317 6.1953 11.0105 6.00719 11.1496 5.86814C11.2887 5.72908 11.4768 5.6502 11.6734 5.64849C11.8701 5.64679 12.0595 5.72238 12.201 5.859ZM9.06146 7.9365C9.35983 7.9365 9.64598 8.05503 9.85696 8.266C10.0679 8.47698 10.1865 8.76313 10.1865 9.0615C10.1865 9.35987 10.0679 9.64602 9.85696 9.857C9.64598 10.068 9.35983 10.1865 9.06146 10.1865C8.76309 10.1865 8.47694 10.068 8.26597 9.857C8.05499 9.64602 7.93646 9.35987 7.93646 9.0615C7.93646 8.76313 8.05499 8.47698 8.26597 8.266C8.47694 8.05503 8.76309 7.9365 9.06146 7.9365Z" fill="#5E626B"/>
        </svg>
      ),
      action: 'start',
    },
    {
      label: 'Reschedule',
      icon: (
        <svg width="14" height="14" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.25 2.25H13.5V0.75H12V2.25H6V0.75H4.5V2.25H3.75C2.9175 2.25 2.25 2.9175 2.25 3.75V14.25C2.25 14.6478 2.40804 15.0294 2.68934 15.3107C2.97064 15.592 3.35218 15.75 3.75 15.75H14.25C15.075 15.75 15.75 15.075 15.75 14.25V3.75C15.75 3.35217 15.592 2.97064 15.3107 2.68934C15.0294 2.40804 14.6478 2.25 14.25 2.25ZM14.25 14.25H3.75V6H14.25V14.25ZM9 7.5V9H12V11.25H9V12.75L6 10.125L9 7.5Z" fill="#4E87F6"/>
        </svg>
      ),
      action: 'reschedule',
    },
    {
      label: 'Edit Prescription',
      icon: <Edit size={14} className="text-gray-600" />,
      action: 'edit',
    },

  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 hover:bg-gray-100 rounded transition-colors duration-200"
      >
        <MoreHorizontal size={16} className="text-gray-600" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="py-1">
            {menuItems.map((item, index) => (
              <button
                key={item.action}
                onClick={() => handleAction(item.action)}
                className="w-full px-3 py-2 flex items-center gap-2.5 text-left transition-colors duration-150 hover:bg-gray-50 text-gray-700 text-sm"
              >
                <div className="flex items-center justify-center">
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionMenu;