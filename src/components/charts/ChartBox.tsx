import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, 
  BarChart, 
  PieChart, 
  AreaChart, 
  Line, 
  Bar, 
  Pie, 
  Area, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// Mock toast function since react-hot-toast isn't available
const toast = (message: string, options?: { icon?: string }) => {
  console.log(`${options?.icon || ''} ${message}`);
};

// Mock icon component since react-icons isn't available in this environment
const MockIcon = ({ className }: { className?: string }) => (
  <div className={`${className} bg-blue-500 rounded`} style={{ width: '1em', height: '1em' }} />
);

interface ChartBoxProps {
  chartType: string; // 'line', 'bar', 'area', 'pie'
  color?: string;
  IconBox?: React.ComponentType<{ className?: string }>;
  title?: string;
  dataKey?: string;
  number?: number | string;
  percentage?: number;
  chartData?: object[];
  chartPieData?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  chartAreaData?: Array<{
    name: string;
    consultation?: number;
    surgery?: number;
    therapy?: number;
    checkup?: number;
    smartphones?: number;
    consoles?: number;
    laptops?: number;
    others?: number;
  }>;
  isLoading?: boolean;
  isSuccess?: boolean;
  // New prop for navigation
  viewAllRoute?: string;
}

export const ChartBox: React.FC<ChartBoxProps> = ({
  chartType,
  color = '#8884d8',
  IconBox = MockIcon,
  title = 'Chart Title',
  dataKey = 'value',
  number = '1,234',
  percentage = 12,
  chartData = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 500 },
    { name: 'Jun', value: 700 }
  ],
  chartPieData = [
    { name: 'Desktop', value: 400, color: '#0088FE' },
    { name: 'Mobile', value: 300, color: '#00C49F' },
    { name: 'Tablet', value: 300, color: '#FFBB28' },
    { name: 'Other', value: 200, color: '#FF8042' }
  ],
  chartAreaData = [
    { name: 'Jan', consultation: 120, surgery: 45, therapy: 80, checkup: 200 },
    { name: 'Feb', consultation: 135, surgery: 52, therapy: 95, checkup: 180 },
    { name: 'Mar', consultation: 145, surgery: 38, therapy: 110, checkup: 220 },
    { name: 'Apr', consultation: 160, surgery: 65, therapy: 85, checkup: 195 },
    { name: 'May', consultation: 140, surgery: 48, therapy: 125, checkup: 210 },
    { name: 'Jun', consultation: 175, surgery: 55, therapy: 100, checkup: 185 }
  ],
  isLoading = false,
  isSuccess = true,
  viewAllRoute
}) => {
  const navigate = useNavigate();

  // Handle view all click with navigation
  const handleViewAllClick = () => {
    if (viewAllRoute) {
      navigate(viewAllRoute);
    } else {
      // Fallback behavior - you can customize this based on chart type or title
      const fallbackRoutes: { [key: string]: string } = {
        'Revenue': '/charts?filter=revenue',
        'Sales': '/charts?filter=sales', 
        'Patients': '/patients',
        'Total Appointments': '/dashboard',
        'Appointments': '/dashboard',
        'Today Appointments': '/dashboard?tab=today',
        'Today\'s Booked Slots': '/dashboard?tab=today',
        'Today\'s Appointments': '/dashboard?tab=today',
        'Future Appointments': '/dashboard?tab=future',
        'Past Appointments': '/dashboard?tab=past',
        'Traffic Sources': '/charts?filter=traffic',
        'Medical Services': '/charts?filter=services',
        'Daily Visits': '/charts?filter=visits'
      };
      
      const route = fallbackRoutes[title] || '/charts';
      navigate(route);
    }
    
    toast(`Navigating to view all ${title}`, { icon: '📊' });
  };

  // Skeleton component for loading states
  const Skeleton = ({ className }: { className: string }) => (
    <div className={`animate-pulse bg-gray-300 rounded ${className}`}></div>
  );

  // View All Button Component
  const ViewAllButton = () => (
    <button
      onClick={handleViewAllClick}
      className="text-blue-600 hover:text-blue-800 font-medium text-sm underline-offset-4 hover:underline transition-colors"
    >
      View All
    </button>
  );

  if (chartType === 'line') {
    if (isLoading) {
      return (
        <div className="w-full h-full flex justify-between items-end xl:gap-5">
          <div className="flex h-full flex-col justify-between items-start">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8" />
              <Skeleton className="w-20 h-6" />
            </div>
            <Skeleton className="w-16 h-8" />
            <Skeleton className="w-12 h-4" />
          </div>
          <div className="flex h-full grow flex-col justify-between items-end">
            <Skeleton className="w-full h-16" />
            <Skeleton className="w-16 h-6" />
          </div>
        </div>
      );
    }

    if (isSuccess) {
      return (
        <div className="w-full h-full flex justify-between items-end xl:gap-5">
          <div className="flex h-full flex-col justify-between items-start">
            <div className="flex items-center gap-2 mb-4">
              <IconBox className="text-2xl text-gray-600" />
              <span className="text-base font-semibold text-gray-700 leading-tight">
                {title}
              </span>
            </div>
            <span className="font-bold text-2xl text-gray-900 mb-2">
              {number}
            </span>
            <ViewAllButton />
          </div>
          <div className="flex h-full grow flex-col justify-between items-end">
            <div className="w-full h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: color,
                      border: 'none',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    itemStyle={{ color: 'white' }}
                    labelStyle={{ display: 'none' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`${
                  percentage && percentage > 0
                    ? 'text-green-600'
                    : percentage && percentage < 0
                    ? 'text-red-600'
                    : 'text-gray-600'
                } font-medium text-sm`}
              >
                {percentage && percentage > 0 ? '+' : ''}{percentage}%
              </span>
              <span className="text-gray-500 text-sm">this month</span>
            </div>
          </div>
        </div>
      );
    }
  }

  // Bar Chart
  if (chartType === 'bar') {
    if (isLoading) {
      return (
        <div className="w-full h-full flex justify-between items-end xl:gap-5">
          <div className="flex h-full flex-col justify-between items-start">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8" />
              <Skeleton className="w-20 h-6" />
            </div>
            <Skeleton className="w-16 h-8" />
            <Skeleton className="w-12 h-4" />
          </div>
          <div className="flex h-full grow flex-col justify-between items-end">
            <Skeleton className="w-full h-16" />
            <Skeleton className="w-16 h-6" />
          </div>
        </div>
      );
    }

    if (isSuccess) {
      return (
        <div className="w-full h-full flex justify-between items-end xl:gap-5">
          <div className="flex h-full flex-col justify-between items-start">
            <div className="flex items-center gap-2 mb-4">
              <IconBox className="text-2xl text-gray-600" />
              <span className="text-base font-semibold text-gray-700 leading-tight">
                {title}
              </span>
            </div>
            <span className="font-bold text-2xl text-gray-900 mb-2">
              {number}
            </span>
            <ViewAllButton />
          </div>
          <div className="flex h-full grow flex-col justify-between items-end">
            <div className="w-full h-16">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <Bar dataKey={dataKey} fill={color} radius={[2, 2, 0, 0]} />
                  <Tooltip
                    contentStyle={{
                      background: color,
                      border: 'none',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    itemStyle={{ color: 'white' }}
                    labelStyle={{ display: 'none' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`${
                  percentage && percentage > 0
                    ? 'text-green-600'
                    : percentage && percentage < 0
                    ? 'text-red-600'
                    : 'text-gray-600'
                } font-medium text-sm`}
              >
                {percentage && percentage > 0 ? '+' : ''}{percentage}%
              </span>
              <span className="text-gray-500 text-sm">this month</span>
            </div>
          </div>
        </div>
      );
    }
  }

  // Pie Chart
  if (chartType === 'pie') {
    if (isLoading) {
      return (
        <div className="w-full h-full flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="w-8 h-8" />
            <Skeleton className="w-20 h-6" />
          </div>
          <div className="flex-1 flex justify-center items-center">
            <Skeleton className="w-32 h-32 rounded-full" />
          </div>
          <div className="flex justify-between items-center mt-4">
            <Skeleton className="w-16 h-8" />
            <Skeleton className="w-12 h-4" />
          </div>
        </div>
      );
    }

    if (isSuccess) {
      return (
        <div className="w-full h-full flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <IconBox className="text-2xl text-gray-600" />
            <span className="text-base font-semibold text-gray-700 leading-tight">
              {title}
            </span>
          </div>
          <div className="flex-1 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center mt-4">
            <span className="font-bold text-2xl text-gray-900">
              {number}
            </span>
            <ViewAllButton />
          </div>
        </div>
      );
    }
  }

  // Area Chart
  if (chartType === 'area') {
    if (isLoading) {
      return (
        <div className="w-full h-full flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="w-8 h-8" />
            <Skeleton className="w-20 h-6" />
          </div>
          <div className="flex-1">
            <Skeleton className="w-full h-full" />
          </div>
          <div className="flex justify-between items-center mt-4">
            <Skeleton className="w-16 h-8" />
            <Skeleton className="w-12 h-4" />
          </div>
        </div>
      );
    }

    if (isSuccess) {
      return (
        <div className="w-full h-full flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <IconBox className="text-2xl text-gray-600" />
            <span className="text-base font-semibold text-gray-700 leading-tight">
              {title}
            </span>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartAreaData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="consultation"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="surgery"
                  stackId="1"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="therapy"
                  stackId="1"
                  stroke="#ffc658"
                  fill="#ffc658"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="checkup"
                  stackId="1"
                  stroke="#ff7300"
                  fill="#ff7300"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center mt-4">
            <span className="font-bold text-2xl text-gray-900">
              {number}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`${
                  percentage && percentage > 0
                    ? 'text-green-600'
                    : percentage && percentage < 0
                    ? 'text-red-600'
                    : 'text-gray-600'
                } font-medium text-sm`}
              >
                {percentage && percentage > 0 ? '+' : ''}{percentage}%
              </span>
              <ViewAllButton />
            </div>
          </div>
        </div>
      );
    }
  }

  // Default fallback
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-gray-500">Invalid chart type: {chartType}</span>
    </div>
  );
};