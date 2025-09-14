// pages/Charts/ChartsPage.tsx
import React from 'react';
import DashboardLayout from '../../components/Dashboard/layout/DashboardLayout';
import { Chart } from '../../components/charts/Chart';

const ChartsPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Charts</h1>
            <p className="text-gray-600 mt-1">View comprehensive medical analytics and statistics</p>
          </div>
        </div>
        
        {/* Chart Component */}
        <Chart />
      </div>
    </DashboardLayout>
  );
};

export default ChartsPage;