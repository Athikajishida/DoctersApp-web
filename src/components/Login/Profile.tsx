import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAuthenticatedRequest } from '../../hooks/useAuthenticatedRequest';
import Header from '../layouts/Header';

interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  email_address: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
}

interface ConsultationService {
  id: number;
  service_name: string;
  initial_consultation_price: string;
  follow_up_consultation_price: string;
  initial_slot_duration_minutes: number;
  follow_up_slot_duration_minutes: number;
  created_at: string;
  updated_at: string;
}

interface AdminSettings {
  admin_user: AdminUser;
  consultation_service: ConsultationService;
}

interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface AdminProfileForm {
  first_name: string;
  last_name: string;
  phone_number: string;
}

interface ConsultationSettingsForm {
  initial_consultation_price: string;
  follow_up_consultation_price: string;
  initial_slot_duration_minutes: number;
  follow_up_slot_duration_minutes: number;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { makeRequest } = useAuthenticatedRequest();
  
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingConsultation, setIsEditingConsultation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [profileForm, setProfileForm] = useState<AdminProfileForm>({
    first_name: '',
    last_name: '',
    phone_number: ''
  });

  const [consultationForm, setConsultationForm] = useState<ConsultationSettingsForm>({
    initial_consultation_price: '',
    follow_up_consultation_price: '',
    initial_slot_duration_minutes: 20,
    follow_up_slot_duration_minutes: 10
  });

  // Fetch admin settings on component mount
  useEffect(() => {
    fetchAdminSettings();
  }, []);

  const fetchAdminSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const response = await makeRequest('/api/v1/admin/admin_settings');
      
      if (response.ok) {
        const data: AdminSettings = await response.json();
        setAdminSettings(data);
        
        // Initialize forms with current data
        setProfileForm({
          first_name: data.admin_user.first_name,
          last_name: data.admin_user.last_name,
          phone_number: data.admin_user.phone_number
        });
        
        setConsultationForm({
          initial_consultation_price: data.consultation_service.initial_consultation_price,
          follow_up_consultation_price: data.consultation_service.follow_up_consultation_price,
          initial_slot_duration_minutes: data.consultation_service.initial_slot_duration_minutes,
          follow_up_slot_duration_minutes: data.consultation_service.follow_up_slot_duration_minutes
        });
      } else {
        showToast('Failed to load admin settings', 'error');
      }
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      showToast('Failed to load admin settings', 'error');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConsultationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConsultationForm(prev => ({
      ...prev,
      [name]: name.includes('minutes') ? parseInt(value) || 0 : value
    }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showToast('New password must be at least 6 characters long', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await makeRequest('/api/v1/auth/change_password', {
        method: 'PATCH',
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword
        })
      });

      if (response.ok) {
        showToast('Password changed successfully', 'success');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setIsChangingPassword(false);
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to change password', 'error');
      }
    } catch (error) {
      showToast('Failed to change password', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await makeRequest('/api/v1/admin/admin_settings', {
        method: 'PATCH',
        body: JSON.stringify({
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          phone_number: profileForm.phone_number
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAdminSettings(data);
        showToast('Profile updated successfully', 'success');
        setIsEditingProfile(false);
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to update profile', 'error');
      }
    } catch (error) {
      showToast('Failed to update profile', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConsultationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await makeRequest('/api/v1/admin/admin_settings', {
        method: 'PATCH',
        body: JSON.stringify({
          initial_consultation_price: consultationForm.initial_consultation_price,
          follow_up_consultation_price: consultationForm.follow_up_consultation_price,
          initial_slot_duration_minutes: consultationForm.initial_slot_duration_minutes,
          follow_up_slot_duration_minutes: consultationForm.follow_up_slot_duration_minutes
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAdminSettings(data);
        showToast('Consultation settings updated successfully', 'success');
        setIsEditingConsultation(false);
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to update consultation settings', 'error');
      }
    } catch (error) {
      showToast('Failed to update consultation settings', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: string) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  if (!user || isLoadingSettings) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#28542F] mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900">Loading...</h2>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Profile & Settings</h1>
          <p className="text-gray-600 mt-2">Manage your profile information and consultation settings</p>
        </div>

        <div className="space-y-8">
          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                {!isEditingProfile && adminSettings && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-2 bg-[#28542F] text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {adminSettings && (
              <div className="p-6">
                {isEditingProfile ? (
                      <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              First Name
                            </label>
                            <input
                              type="text"
                              name="first_name"
                              value={profileForm.first_name}
                              onChange={handleProfileChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#28542F] focus:border-transparent"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Last Name
                            </label>
                            <input
                              type="text"
                              name="last_name"
                              value={profileForm.last_name}
                              onChange={handleProfileChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#28542F] focus:border-transparent"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              name="phone_number"
                              value={profileForm.phone_number}
                              onChange={handleProfileChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#28542F] focus:border-transparent"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email Address
                            </label>
                            <div className="p-3 bg-gray-100 border rounded-md text-gray-600">
                              {adminSettings.admin_user.email_address}
                              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-4">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-[#28542F] text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingProfile(false);
                              setProfileForm({
                                first_name: adminSettings.admin_user.first_name,
                                last_name: adminSettings.admin_user.last_name,
                                phone_number: adminSettings.admin_user.phone_number
                              });
                            }}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="p-3 bg-gray-50 border rounded-md">
                        {adminSettings.admin_user.first_name} {adminSettings.admin_user.last_name}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="p-3 bg-gray-50 border rounded-md">
                        {adminSettings.admin_user.email_address}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="p-3 bg-gray-50 border rounded-md">
                        {adminSettings.admin_user.phone_number}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Member Since
                      </label>
                      <div className="p-3 bg-gray-50 border rounded-md">
                        {formatDate(adminSettings.admin_user.created_at)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Consultation Settings */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Consultation Settings</h2>
                {!isEditingConsultation && adminSettings && (
                  <button
                    onClick={() => setIsEditingConsultation(true)}
                    className="px-4 py-2 bg-[#28542F] text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Edit Settings
                  </button>
                )}
              </div>
            </div>

            {adminSettings && (
              <div className="p-6">
                {isEditingConsultation ? (
                      <form onSubmit={handleConsultationSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Initial Consultation Price (₹)
                            </label>
                            <input
                              type="number"
                              name="initial_consultation_price"
                              value={consultationForm.initial_consultation_price}
                              onChange={handleConsultationChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#28542F] focus:border-transparent"
                              required
                              min="0"
                              step="0.01"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Follow-up Consultation Price (₹)
                            </label>
                            <input
                              type="number"
                              name="follow_up_consultation_price"
                              value={consultationForm.follow_up_consultation_price}
                              onChange={handleConsultationChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#28542F] focus:border-transparent"
                              required
                              min="0"
                              step="0.01"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Initial Slot Duration (minutes)
                            </label>
                            <input
                              type="number"
                              name="initial_slot_duration_minutes"
                              value={consultationForm.initial_slot_duration_minutes}
                              onChange={handleConsultationChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#28542F] focus:border-transparent"
                              required
                              min="5"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Follow-up Slot Duration (minutes)
                            </label>
                            <input
                              type="number"
                              name="follow_up_slot_duration_minutes"
                              value={consultationForm.follow_up_slot_duration_minutes}
                              onChange={handleConsultationChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#28542F] focus:border-transparent"
                              required
                              min="5"
                            />
                          </div>
                        </div>
                        
                        <div className="flex space-x-4">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-[#28542F] text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingConsultation(false);
                              setConsultationForm({
                                initial_consultation_price: adminSettings.consultation_service.initial_consultation_price,
                                follow_up_consultation_price: adminSettings.consultation_service.follow_up_consultation_price,
                                initial_slot_duration_minutes: adminSettings.consultation_service.initial_slot_duration_minutes,
                                follow_up_slot_duration_minutes: adminSettings.consultation_service.follow_up_slot_duration_minutes
                              });
                            }}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Initial Consultation Price
                      </label>
                      <div className="p-3 bg-gray-50 border rounded-md font-semibold text-green-600">
                        {formatCurrency(adminSettings.consultation_service.initial_consultation_price)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Follow-up Consultation Price
                      </label>
                      <div className="p-3 bg-gray-50 border rounded-md font-semibold text-green-600">
                        {formatCurrency(adminSettings.consultation_service.follow_up_consultation_price)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Initial Slot Duration
                      </label>
                      <div className="p-3 bg-gray-50 border rounded-md">
                        {adminSettings.consultation_service.initial_slot_duration_minutes} minutes
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Follow-up Slot Duration
                      </label>
                      <div className="p-3 bg-gray-50 border rounded-md">
                        {adminSettings.consultation_service.follow_up_slot_duration_minutes} minutes
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Password Change Section */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
                {!isChangingPassword && (
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="px-4 py-2 bg-[#28542F] text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Change Password
                  </button>
                )}
              </div>
            </div>

            {isChangingPassword && (
              <div className="p-6">
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#28542F] focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#28542F] focus:border-transparent"
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#28542F] focus:border-transparent"
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <div className="flex space-x-4 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-[#28542F] text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Changing...' : 'Change Password'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordForm({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Account Information
          {adminSettings && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin User ID
                    </label>
                    <div className="p-3 bg-gray-50 border rounded-md font-mono text-sm">
                      {adminSettings.admin_user.id}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Updated
                    </label>
                    <div className="p-3 bg-gray-50 border rounded-md">
                      {formatDate(adminSettings.admin_user.updated_at)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Name
                    </label>
                    <div className="p-3 bg-gray-50 border rounded-md">
                      {adminSettings.consultation_service.service_name}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service ID
                    </label>
                    <div className="p-3 bg-gray-50 border rounded-md font-mono text-sm">
                      {adminSettings.consultation_service.id}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )} */}
        </div>
      </main>
    </div>
  );
};

export default Profile;