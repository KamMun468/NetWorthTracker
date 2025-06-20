import React, { useState } from 'react';

const EditNameModal = ({ item, onClose, onUpdate }) => {
  const [newName, setNewName] = useState(item.name);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNameChange = (e) => {
    const value = e.target.value;
    setNewName(value);
    if (error) {
      setError('');
    }
  };

  const validateName = () => {
    if (!newName.trim()) {
      setError('Name is required');
      return false;
    }
    
    if (newName.trim() === item.name) {
      setError('New name must be different from current name');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateName()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(item.id, newName.trim());
    } catch (error) {
      console.error('Error updating name:', error);
      setError('Failed to update name. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Asset':
        return 'text-green-600 bg-green-50';
      case 'Liability':
        return 'text-red-600 bg-red-50';
      case 'Debt':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Item Name</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Item Info */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">Current: {item.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                {item.type}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="newName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Name *
              </label>
              <input
                type="text"
                id="newName"
                value={newName}
                onChange={handleNameChange}
                placeholder="Enter new name"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                  isSubmitting
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isSubmitting ? 'Updating...' : 'Update Name'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditNameModal; 