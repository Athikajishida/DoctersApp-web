import React from 'react';
import { TabType } from '../../types/dashboard.types';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'today' as TabType, label: 'Today', color: 'blue' },
    { id: 'future' as TabType, label: 'Future Appointment', color: 'gray' },
    { id: 'past' as TabType, label: 'Past Appointment', color: 'gray' }
  ];

  return (
    <div className="mb-8">
      <div className="flex space-x-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-6 py-3 font-medium text-sm rounded-t-lg ${
              activeTab === tab.id
                ? 'bg-[#E6F3FF] text-[#4A90E2] border-b-2 border-[#4A90E2]'
                : 'bg-transparent text-[#666666] hover:text-[#333333]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabNavigation;