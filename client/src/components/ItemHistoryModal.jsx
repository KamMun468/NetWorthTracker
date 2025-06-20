import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const API_BASE = 'http://localhost:5001/api';

const ItemHistoryModal = ({ item, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Asset':
        return 'text-green-600 bg-green-50 dark:bg-[#1a1a1a] dark:text-green-400 dark:font-bold';
      case 'Liability':
        return 'text-red-600 bg-red-50 dark:bg-[#1a1a1a] dark:text-red-400 dark:font-bold';
      case 'Debt':
        return 'text-orange-600 bg-orange-50 dark:bg-[#1a1a1a] dark:text-orange-400 dark:font-bold';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-[#1a1a1a] dark:text-gray-400 dark:font-bold';
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE}/items/${item.id}/history`);
        setHistory(response.data);
      } catch (error) {
        console.error('Error fetching history:', error);
        setError('Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [item.id]);

  const calculateChange = (currentValue, previousValue) => {
    if (previousValue === undefined || previousValue === null) return null;
    const change = currentValue - previousValue;
    const percentage = previousValue !== 0 ? ((change / Math.abs(previousValue)) * 100) : 0;
    return { change, percentage };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#0f0f0f] rounded-xl max-w-2xl w-full max-h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{item.name}</h2>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                {item.type}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300">Value History</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500 dark:text-gray-400">Loading history...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-red-500 dark:text-red-400">{error}</div>
            </div>
          ) : history.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No History</h3>
                <p className="text-gray-500 dark:text-gray-400">No value history found for this item</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry, index) => {
                const nextEntry = history[index + 1];
                const changeData = calculateChange(entry.value, nextEntry?.value);
                
                return (
                  <div key={entry.id} className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(entry.date), 'MMM dd, yyyy \'at\' h:mm a')}
                      </div>
                      {index === 0 && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(entry.value)}
                      </div>
                      
                      {changeData && (
                        <div className={`text-sm font-medium ${
                          changeData.change > 0 ? 'text-green-600 dark:text-green-400' : 
                          changeData.change < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {changeData.change > 0 ? '+' : ''}
                          {formatCurrency(changeData.change)}
                          {changeData.percentage !== 0 && (
                            <span className="ml-1">
                              ({changeData.change > 0 ? '+' : ''}{changeData.percentage.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemHistoryModal; 