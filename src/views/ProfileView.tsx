import React, { useState, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { uploadImageToImgBB } from '../lib/image-upload';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  Camera, 
  Key, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Edit2,
  LogOut
} from 'lucide-react';

const AVATAR_PRESETS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-400 to-teal-600',
  'from-rose-400 to-pink-600',
  'from-amber-400 to-orange-500',
  'from-violet-500 to-purple-700',
  'from-cyan-500 to-blue-600'
];

export const ProfileView: React.FC = () => {
  const { currentUser, updateProfile, addAlert, logoutUser } = useInventory();
  
  // Personal Details Edit State
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.fullName || currentUser?.username || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [email] = useState(currentUser?.email || ''); // Read-only

  // Password Settings State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  // Show/Hide password states
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Avatar presets and custom upload state
  const savedImage = currentUser?.image || '';
  const [selectedPreset, setSelectedPreset] = useState<string>(
    savedImage.startsWith('preset:') ? savedImage.replace('preset:', '') : ''
  );
  const [customImage, setCustomImage] = useState<string>(
    savedImage.startsWith('preset:') ? '' : savedImage
  );
  const [hasUnsavedPhoto, setHasUnsavedPhoto] = useState(false);
  const [hasUnsavedTheme, setHasUnsavedTheme] = useState(false);

  // Feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  // Upload the image for preview only. It is persisted when Save Photo is clicked.
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setError('Image file is too large. Please select an image under 8MB.');
        e.target.value = '';
        return;
      }

      setIsUploadingImage(true);
      setError(null);
      try {
        const imageURL = await uploadImageToImgBB(file);
        setCustomImage(imageURL);
        setSelectedPreset('');
        setHasUnsavedPhoto(true);
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload profile picture.');
      } finally {
        setIsUploadingImage(false);
        e.target.value = '';
      }
    }
  };

  const handleSaveAvatarChanges = () => {
    if ((!customImage && !selectedPreset) || (!hasUnsavedPhoto && !hasUnsavedTheme) || isUploadingImage) return;

    const finalImage = selectedPreset ? `preset:${selectedPreset}` : customImage;
    updateProfile(fullName, username, email, finalImage);
    setHasUnsavedPhoto(false);
    setHasUnsavedTheme(false);
    addAlert('system', 'Profile Appearance Updated', 'Your profile photo or theme color was saved successfully.');
  };

  const handleCancelAvatarChanges = () => {
    const currentImage = currentUser.image || '';
    setSelectedPreset(currentImage.startsWith('preset:') ? currentImage.replace('preset:', '') : '');
    setCustomImage(currentImage.startsWith('preset:') ? '' : currentImage);
    setHasUnsavedPhoto(false);
    setHasUnsavedTheme(false);
    setError(null);
  };

  // Handle choosing a preset color theme
  const handlePresetSelect = (preset: string) => {
    setSelectedPreset(preset);
    setCustomImage('');
    setHasUnsavedPhoto(false);
    setHasUnsavedTheme(currentUser.image !== `preset:${preset}`);
    setError(null);
  };

  // Handle Personal Details Save
  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaveSuccess(false);

    if (!username.trim()) {
      setError('Username name cannot be empty.');
      return;
    }

    setIsSaving(true);

    setTimeout(() => {
      const finalImage = selectedPreset
        ? hasUnsavedTheme
          ? (currentUser.image || '')
          : `preset:${selectedPreset}`
        : hasUnsavedPhoto
          ? (currentUser.image || '')
          : customImage;
      updateProfile(fullName.trim(), username.trim(), email, finalImage);
      
      setIsSaving(false);
      setSaveSuccess(true);
      setIsEditingDetails(false);
      
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    }, 600);
  };

  // Handle Password Update
  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!oldPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (!newPassword) {
      setPasswordError('Please enter your new password.');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('The new password and confirmation password do not match.');
      return;
    }

    // Verify current password matches
    const actualCurrentPassword = currentUser.password || 'administrator';
    if (oldPassword !== actualCurrentPassword) {
      setPasswordError('Current password is incorrect. Password update rejected.');
      return;
    }

    setIsUpdatingPassword(true);

    setTimeout(() => {
      const finalImage = hasUnsavedPhoto || hasUnsavedTheme
        ? (currentUser.image || '')
        : selectedPreset
          ? `preset:${selectedPreset}`
          : customImage;
      
      // Update details including the new password
      updateProfile(fullName, username, email, finalImage, newPassword);
      
      setIsUpdatingPassword(false);
      setPasswordSuccess(true);
      
      // Clear password fields
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      setTimeout(() => {
        setPasswordSuccess(false);
      }, 4000);
    }, 800);
  };

  // Helper to render user initials or custom image
  const renderAvatarPreview = () => {
    if (customImage && !customImage.startsWith('preset:')) {
      return (
        <img 
          src={customImage} 
          alt="Profile Preview" 
          className="w-32 h-32 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-md"
          referrerPolicy="no-referrer"
        />
      );
    }

    const presetClass = selectedPreset || (customImage.startsWith('preset:') ? customImage.replace('preset:', '') : 'from-blue-500 to-indigo-600');
    return (
      <div className={`w-32 h-32 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr ${presetClass} text-white flex items-center justify-center text-3xl font-bold shadow-md uppercase border-4 border-white`}>
        {username ? username.slice(0, 2) : 'US'}
      </div>
    );
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      {/* Page Header */}
      <div className="mobile-page-header flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">My Profile Settings</h1>
          <p className="mobile-page-description text-xs text-slate-500">Manage your profile details, theme preset, and secure login passwords.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card & Avatar Selection */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col items-center text-center">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {renderAvatarPreview()}
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <button 
              type="button"
              className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full shadow-md transition-colors"
              title="Upload custom picture"
            >
              {isUploadingImage ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Upload className="w-3.5 h-3.5" />}
            </button>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />

          {(hasUnsavedPhoto || hasUnsavedTheme) && (
            <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.value = '';
                fileInputRef.current?.click();
              }}
              disabled={isUploadingImage}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload className="w-3.5 h-3.5" />
              {isUploadingImage ? 'Uploading...' : 'Change Photo'}
            </button>
            <button
              type="button"
              onClick={handleSaveAvatarChanges}
              disabled={(!hasUnsavedPhoto && !hasUnsavedTheme) || isUploadingImage}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Check className="w-3.5 h-3.5" />
              Save Changes
            </button>
            {(hasUnsavedPhoto || hasUnsavedTheme) && (
              <button
                type="button"
                onClick={handleCancelAvatarChanges}
                disabled={isUploadingImage}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 transition-colors hover:border-rose-300 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            )}
            </div>
          )}
          {hasUnsavedPhoto && !isUploadingImage && (
            <p className="mt-2 text-[10px] font-semibold text-amber-600">Change selected. Click Save Changes to apply it.</p>
          )}

          <h3 className="text-base font-bold text-slate-800 mt-4 capitalize">{currentUser.fullName}</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 mt-1 uppercase tracking-wider border border-blue-100">
            {currentUser.role}
          </span>

          <div className="w-full border-t border-slate-100 my-5"></div>

          {/* Avatar Presets Selection */}
          <div className="w-full text-left space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-1">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Choose Profile Theme Color</span>
            </h4>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_PRESETS.map((preset, index) => {
                const isSelected = selectedPreset === preset || (!selectedPreset && customImage === `preset:${preset}`);
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`h-8 rounded-lg bg-gradient-to-tr ${preset} relative transition-all duration-200 hover:scale-105 shadow-sm cursor-pointer`}
                  >
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center text-white bg-black/10 rounded-lg">
                        <Check className="w-4 h-4 font-bold" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 text-center pt-1">
              Select a photo or theme, then save or cancel your change
            </p>
          </div>

          <div className="w-full border-t border-slate-100 my-5"></div>

          {/* Read-only account properties */}
          <div className="w-full space-y-3.5 text-left text-xs">
            <div className="flex justify-between items-center bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-semibold flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>Account Role</span>
              </span>
              <span className="text-slate-700 font-bold">{currentUser.role}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-semibold flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Created Date</span>
              </span>
              <span className="text-slate-700 font-bold">
                {new Date(currentUser.createdAt).toLocaleDateString(undefined, { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>

          <div className="w-full border-t border-slate-100 my-5"></div>

          <button
            onClick={logoutUser}
            className="w-full py-2 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 hover:border-rose-300 text-rose-600 hover:text-rose-700 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center space-x-2 cursor-pointer shadow-sm shadow-rose-500/5"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Account</span>
          </button>
        </div>

        {/* Profile Settings Form */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm lg:col-span-2 space-y-8">
          
          {/* Section 1: Personal Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">Personal Details</h3>
              
              {!isEditingDetails && (
                <button
                  type="button"
                  onClick={() => setIsEditingDetails(true)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Details</span>
                </button>
              )}
            </div>
            
            {/* Success and Error Banners for Personal Details */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs flex items-center space-x-2 animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs flex items-center space-x-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>Personal details saved successfully! Your profile username has been updated.</span>
              </div>
            )}

            {/* Render Static Display Mode OR Editable Form Mode */}
            {!isEditingDetails ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50/50 p-3.5 rounded-lg border border-slate-100/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 tracking-wider">Full Name</span>
                  <span className="text-xs font-semibold text-slate-800 capitalize flex items-center space-x-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentUser.fullName || currentUser.username}</span>
                  </span>
                </div>

                <div className="bg-slate-50/50 p-3.5 rounded-lg border border-slate-100/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 tracking-wider">Username Name</span>
                  <span className="text-xs font-semibold text-slate-800 capitalize flex items-center space-x-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentUser.username}</span>
                  </span>
                </div>
                
                <div className="bg-slate-50/50 p-3.5 rounded-lg border border-slate-100/80">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 tracking-wider">Email Address</span>
                    <span className="text-[9px] bg-slate-200 text-slate-500 font-bold px-1.5 py-0.5 rounded">Locked</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentUser.email}</span>
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveDetails} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 block">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter full name"
                        className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 block">Username Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 opacity-70">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-500 block">Email Address</label>
                      <span className="text-[9px] text-slate-400 italic">Cannot be changed</span>
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        disabled
                        placeholder="Your email address"
                        className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 bg-slate-50 text-slate-400 rounded-lg focus:outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFullName(currentUser.fullName);
                      setUsername(currentUser.username);
                      setError(null);
                      setIsEditingDetails(false);
                    }}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Section 2: Update Security Password */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">Update Security Password</h3>
            
            {/* Success and Error Banners for Password */}
            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs flex items-center space-x-2 animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs flex items-center space-x-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>Security password successfully updated and saved to your account!</span>
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">Current Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showOldPassword ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-9 pr-10 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">New Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-9 pr-10 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">Confirm New Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-9 pr-10 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-start">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
                >
                  {isUpdatingPassword ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};
