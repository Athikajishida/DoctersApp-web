import React from 'react';

interface PatientStatusBadgeProps {
  status: 'active' | 'inactive';
  size?: 'sm' | 'md' | 'lg';
}

const PatientStatusBadge: React.FC<PatientStatusBadgeProps> = ({ 
  status, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base'
  };

  const statusStyles = {
    active: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      dot: 'bg-green-400'
    },
    inactive: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      dot: 'bg-gray-400'
    }
  };

  const currentStyle = statusStyles[status] || statusStyles.inactive;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${currentStyle.bg} ${currentStyle.text} ${sizeClasses[size]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${currentStyle.dot}`}
      ></span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default PatientStatusBadge;
