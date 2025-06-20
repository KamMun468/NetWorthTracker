import React, { useState, useEffect, useRef } from 'react';

const Sidebar = ({ items, onItemClick, onUpdateClick, onDeleteClick, onEditName, onTypeChange }) => {
  const [sortBy, setSortBy] = useState('mostRecent');
  const [showTypeDropdown, setShowTypeDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowTypeDropdown(null);
      }
    };

    if (showTypeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTypeDropdown]);

  const formatNumber = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatLastUpdated = (dateString) => {
    const lastUpdated = new Date(dateString);
    const today = new Date();
    
    // Check if it's today
    const isToday = lastUpdated.toDateString() === today.toDateString();
    
    if (isToday) {
      return 'today';
    } else {
      // Format as "Jun 17" for other dates
      return lastUpdated.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Asset':
        return 'text-green-600 bg-gray-50 dark:text-green-400 dark:bg-[#1a1a1a] font-bold';
      case 'Liability':
        return 'text-red-600 bg-gray-50 dark:text-red-400 dark:bg-[#1a1a1a] font-bold';
      case 'Debt':
        return 'text-orange-600 bg-gray-50 dark:text-orange-400 dark:bg-[#1a1a1a] font-bold';
      default:
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-[#1a1a1a] font-bold';
    }
  };

  const sortItems = (items, sortBy) => {
    const sortedItems = [...items];
    
    switch (sortBy) {
      case 'mostRecent':
        return sortedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return sortedItems.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'highestValue':
        return sortedItems.sort((a, b) => b.currentValue - a.currentValue);
      case 'lowestValue':
        return sortedItems.sort((a, b) => a.currentValue - b.currentValue);
      case 'byType':
        return sortedItems.sort((a, b) => {
          const typeOrder = { 'Asset': 0, 'Liability': 1, 'Debt': 2 };
          return typeOrder[a.type] - typeOrder[b.type] || a.name.localeCompare(b.name);
        });
      case 'alphabetical':
        return sortedItems.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sortedItems;
    }
  };

  const sortedItems = sortItems(items, sortBy);

  const handleTypeChange = async (item, newType) => {
    console.log('Attempting to change type from', item.type, 'to', newType, 'for item:', item.name);
    if (newType !== item.type) {
      try {
        console.log('Calling onTypeChange with itemId:', item.id, 'newType:', newType);
        await onTypeChange(item.id, newType);
        console.log('Type change successful');
        setShowTypeDropdown(null);
      } catch (error) {
        console.error('Error changing type:', error);
        alert('Failed to change item type. Please try again.');
      }
    } else {
      console.log('Same type selected, closing dropdown');
      setShowTypeDropdown(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white font-serif">Manage your finances</h1>
        
        {/* Sort Selector */}
        {items.length > 0 && (
          <div className="mt-4">
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort by:
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="mostRecent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="highestValue">Highest Value</option>
              <option value="lowestValue">Lowest Value</option>
              <option value="byType">By Type</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 text-sm">No items yet</div>
            <div className="text-gray-400 dark:text-gray-500 text-sm mt-1">Click the + button to add your first item</div>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-transparent p-4 transition-shadow duration-200 shadow-card dark:shadow-none"
              >
                {/* Item Header */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 flex-1 justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800 dark:text-white truncate">{item.name}</h3>
                      <button
                        onClick={() => onEditName(item)}
                        className="text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 transition-colors p-0.5 rounded"
                        title="Edit name"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                    {/* Last Updated - inline with name */}
                    {item.lastUpdated && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 ml-2 whitespace-nowrap">
                        Last updated: {formatLastUpdated(item.lastUpdated)}
                      </div>
                    )}
                  </div>
                  <div className="relative ml-2" ref={showTypeDropdown === item.id ? dropdownRef : null}>
                    <button
                      onClick={() => setShowTypeDropdown(showTypeDropdown === item.id ? null : item.id)}
                      className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${getTypeColor(item.type)}`}
                      title="Click to change type"
                    >
                      {item.type}
                    </button>
                    
                    {showTypeDropdown === item.id && (
                      <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-10 min-w-24">
                        {['Asset', 'Liability', 'Debt'].map((type) => (
                          <button
                            key={type}
                            onClick={() => handleTypeChange(item, type)}
                            className={`block w-full text-left px-3 py-2 text-xs transition-colors first:rounded-t-md last:rounded-b-md ${
                              type === item.type 
                                ? 'bg-gray-200 dark:bg-gray-700 font-semibold text-gray-900 dark:text-white' 
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Current Value */}
                <div className="mb-3">
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    {formatNumber(item.currentValue)}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-1.5">
                  <button
                    onClick={() => onItemClick(item)}
                    className="flex-1 bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 py-1 px-1.5 rounded text-xs font-medium transition-colors duration-200"
                  >
                    View History
                  </button>
                  <button
                    onClick={() => onUpdateClick(item)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-1 px-1.5 rounded text-xs font-medium transition-colors duration-200"
                  >
                    Update Value
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete "${item.name}"? This will remove all its history.`)) {
                        onDeleteClick(item.id);
                      }
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white py-1 px-1.5 rounded text-xs font-medium transition-colors duration-200"
                  >
                    Delete
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar; 