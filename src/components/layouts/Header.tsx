import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuthenticatedRequest } from '../../hooks/useAuthenticatedRequest';
import MedicalLogo from '../assets/icons/MedicalLogo.svg';

interface HeaderProps {
  userName?: string;
  userRole?: string;
}

interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  email_address: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
}

const Header: React.FC<HeaderProps> = ({ 
  userName, 
  userRole 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { makeRequest } = useAuthenticatedRequest();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch admin user data if not available in auth context
  useEffect(() => {
    const fetchAdminData = async () => {
      if (user && (user.full_name === 'Loading...' || user.full_name === 'Admin User')) {
        try {
          const response = await makeRequest('/api/v1/admin/admin_settings');
          if (response.ok) {
            const data = await response.json();
            setAdminUser(data.admin_user);
          }
        } catch (error) {
          console.error('Failed to fetch admin user data:', error);
        }
      }
    };

    if (user) {
      fetchAdminData();
    }
  }, [user, makeRequest]);

  // Use admin user data or fallback to auth context user or props
  const displayName = adminUser 
    ? `${adminUser.first_name} ${adminUser.last_name}`
    : (user?.full_name !== 'Loading...' && user?.full_name !== 'Admin User') 
      ? user?.full_name 
      : userName || "Admin User";
  
  const displayRole = user?.role || userRole || "Admin";
  const displayEmail = adminUser?.email_address || user?.email_address;

  const navigationItems = [
    { label: 'Appointment', path: '/dashboard' },
    { label: 'Patients', path: '/patients' },
    { label: 'Schedule', path: '/schedule' },
    { label: 'Analytics', path: '/charts' }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const handleProfileClick = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfileView = () => {
    navigate('/profile');
    setIsProfileDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-[#28542F] text-white shadow-lg">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <img 
                src={MedicalLogo} 
                alt="Medical Logo" 
                className="h-8 w-8 mr-3"
              />
              <span className="text-xl font-bold">MediConnect</span>
            </div>
           
            {/* Navigation Items */}
            <nav className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {navigationItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`px-4 py-2 font-medium rounded-md transition-colors ${
                      isActivePath(item.path)
                        ? 'bg-white text-[#28542F]'
                        : 'text-white hover:text-green-200 hover:bg-green-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </nav>
          </div>

          {/* User Profile Section */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <div className="text-sm font-medium">{displayName}</div>
              <div className="text-xs text-green-200">{displayRole}</div>
            </div>
            
            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleProfileClick}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-800 overflow-hidden"
              >
                <img 
                  src="/drthomas.jpg" 
                  alt="Profile Avatar" 
                  className="w-full h-full object-cover"
                />
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <div className="font-medium">{displayName}</div>
                    <div className="text-gray-500">{displayEmail}</div>
                  </div>
                  
                  <button
                    onClick={handleProfileView}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      View Profile
                    </div>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;