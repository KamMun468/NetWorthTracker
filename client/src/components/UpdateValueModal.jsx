import React, { useState } from 'react';

const UpdateValueModal = ({ item, onClose, onUpdate }) => {
  const [newValue, setNewValue] = useState(item.currentValue?.toString() || '');
  const [customDate, setCustomDate] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleValueChange = (e) => {
    const value = e.target.value;
    setNewValue(value);
    if (error) {
      setError('');
    }
  };

  const validateValue = () => {
    if (!newValue.trim()) {
      setError('Value is required');
      return false;
    }
    
    if (isNaN(newValue) || parseFloat(newValue) < 0) {
      setError('Please enter a valid positive number');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateValue()) {
      return;
    }

    const parsedValue = parseFloat(newValue);
    
    // Check if the value is actually different
    if (parsedValue === item.currentValue) {
      setError('New value must be different from current value');
      return;
    }

    setIsSubmitting(true);
    try {
      let dateToSend = null;
      if (customDate) {
        // Create a date object in local timezone at noon to avoid timezone issues
        const selectedDate = new Date(customDate + 'T12:00:00');
        dateToSend = selectedDate.toISOString();
      } else {
        // Use current date at noon in local timezone
        const today = new Date();
        const todayAtNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
        dateToSend = todayAtNoon.toISOString();
      }
      await onUpdate(item.id, parsedValue, dateToSend);
    } catch (error) {
      console.error('Error updating value:', error);
      setError('Failed to update value. Please try again.');
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Update Value</h2>
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
              <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                {item.type}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Current Value: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(item.currentValue || 0)}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="newValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Value ($) *
              </label>
              <input
                type="number"
                id="newValue"
                value={newValue}
                onChange={handleValueChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
              )}
            </div>

            {/* Date Input */}
            <div className="mb-4">
              <label htmlFor="customDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date (optional)
              </label>
              <input
                type="date"
                id="customDate"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave blank to use current date and time
              </p>
            </div>

            {/* Value Change Indicator */}
            {newValue && !isNaN(newValue) && parseFloat(newValue) !== item.currentValue && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Change:</span>
                  <span className={`font-semibold ${
                    parseFloat(newValue) > item.currentValue ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {parseFloat(newValue) > item.currentValue ? '+' : ''}
                    {formatCurrency(parseFloat(newValue) - item.currentValue)}
                  </span>
                </div>
              </div>
            )}

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
                {isSubmitting ? 'Updating...' : 'Update Value'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateValueModal; 