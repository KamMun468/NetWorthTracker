import React, { useState } from 'react';

const AddItemModal = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    initialValue: '',
    type: 'Asset',
    customDate: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.initialValue.trim()) {
      newErrors.initialValue = 'Initial value is required';
    } else if (isNaN(formData.initialValue) || parseFloat(formData.initialValue) < 0) {
      newErrors.initialValue = 'Please enter a valid positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const itemData = {
        name: formData.name.trim(),
        initialValue: parseFloat(formData.initialValue),
        type: formData.type
      };
      
      if (formData.customDate) {
        // Create a date object in local timezone at noon to avoid timezone issues
        const selectedDate = new Date(formData.customDate + 'T12:00:00');
        itemData.customDate = selectedDate.toISOString();
      } else {
        // Use current date at noon in local timezone
        const today = new Date();
        const todayAtNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
        itemData.customDate = todayAtNoon.toISOString();
      }
      
      await onAdd(itemData);
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#212121] rounded-xl max-w-md w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Item</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Chase Savings Account, Car Loan"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-black text-gray-900 dark:text-white ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-transparent'
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Initial Value Field */}
            <div>
              <label htmlFor="initialValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Initial Value ($) *
              </label>
              <input
                type="number"
                id="initialValue"
                name="initialValue"
                value={formData.initialValue}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-black text-gray-900 dark:text-white ${
                  errors.initialValue ? 'border-red-500' : 'border-gray-300 dark:border-transparent'
                }`}
              />
              {errors.initialValue && (
                <p className="text-red-500 text-sm mt-1">{errors.initialValue}</p>
              )}
            </div>

            {/* Type Field */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-black text-gray-900 dark:text-white"
              >
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Debt">Debt</option>
              </select>
            </div>

            {/* Date Input */}
            <div>
              <label htmlFor="customDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date (optional)
              </label>
              <input
                type="date"
                id="customDate"
                name="customDate"
                value={formData.customDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-black text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave blank to use current date
              </p>
            </div>

            {/* Type Descriptions */}
            <div className="bg-gray-50 dark:bg-black rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Type Definitions:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li><strong>Asset:</strong> Items with positive value (savings, investments, property)</li>
                <li><strong>Liability:</strong> Financial obligations (credit card balances, loans)</li>
                <li><strong>Debt:</strong> Money owed to others (mortgages, student loans)</li>
              </ul>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 mt-6">
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
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal; 