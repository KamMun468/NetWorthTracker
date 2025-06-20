import React, { useState, useEffect } from 'react';

const FinancialOverview = ({ summaryStats, netWorthHistory }) => {
  const [overviewData, setOverviewData] = useState({
    day: { change: 0, breakdown: [], itemBreakdown: [] },
    week: { change: 0, breakdown: [], itemBreakdown: [] },
    month: { change: 0, breakdown: [], itemBreakdown: [] },
    year: { change: 0, breakdown: [], itemBreakdown: [] }
  });
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('day');
  const [showDetails, setShowDetails] = useState(false);

  // Fetch items data
  useEffect(() => {
    const fetchItems = async () => {
      try {
        console.log('Starting to fetch items...');
        const response = await fetch('/api/items');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const itemsData = await response.json();
        console.log('Fetched items:', itemsData);
        setItems(itemsData);
      } catch (error) {
        console.error('Error fetching items:', error);
        setItems([]); // Set empty array on error
      }
    };

    fetchItems();
  }, []);

  // Calculate period changes
  const calculatePeriodChange = async (days) => {
    console.log(`Calculating change for ${days} days`);
    
    // If no history, return zero change
    if (!netWorthHistory || netWorthHistory.length === 0) {
      console.log('No net worth history available');
      return { change: 0, breakdown: [], itemBreakdown: [] };
    }

    // Sort net worth history by date (oldest first for proper chronological order)
    const sortedHistory = [...netWorthHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get the most recent data point (current)
    const currentData = sortedHistory[sortedHistory.length - 1];
    const currentDate = new Date(currentData.date);
    
    console.log(`Current data: ${currentData.date} with net worth ${currentData.netWorth}`);
    
    // Calculate the target past date based on the current date, not today
    const pastTargetDate = new Date(currentDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    console.log(`Looking for data on or before: ${pastTargetDate.toISOString()}`);
    
    // Find the data point closest to but not after the target past date
    let pastData = null;
    for (let i = 0; i < sortedHistory.length; i++) {
      const dataDate = new Date(sortedHistory[i].date);
      if (dataDate <= pastTargetDate) {
        pastData = sortedHistory[i];
      } else {
        break;
      }
    }
    
    // If no past data found or past data is same as current, use the first available data point
    if (!pastData || pastData.date === currentData.date) {
      if (sortedHistory.length > 1) {
        pastData = sortedHistory[0]; // Use the oldest data point
      } else {
        // Only one data point, no change possible
        console.log('Only one data point available, no change to calculate');
        return { change: 0, breakdown: [], itemBreakdown: [] };
      }
    }
    
    console.log(`Past data: ${pastData.date} with net worth ${pastData.netWorth}`);
    console.log(`Calculated change: ${currentData.netWorth} - ${pastData.netWorth} = ${currentData.netWorth - pastData.netWorth}`);
    
    const change = currentData.netWorth - pastData.netWorth;
    
    // Calculate breakdown
    const breakdown = [
      { 
        category: 'Assets', 
        change: currentData.totalAssets - pastData.totalAssets,
        current: currentData.totalAssets,
        previous: pastData.totalAssets
      },
      { 
        category: 'Liabilities', 
        change: currentData.totalLiabilities - pastData.totalLiabilities,
        current: currentData.totalLiabilities,
        previous: pastData.totalLiabilities
      },
      { 
        category: 'Debt', 
        change: currentData.totalDebt - pastData.totalDebt,
        current: currentData.totalDebt,
        previous: pastData.totalDebt
      }
    ];

    // Calculate individual item breakdown
    const itemBreakdown = [];
    
    try {
      if (items.length > 0) {
        console.log(`Fetching individual item changes for ${items.length} items`);
        
        for (const item of items) {
          try {
            const response = await fetch(`/api/items/${item.id}/history`);
            if (!response.ok) {
              console.log(`Failed to fetch history for item ${item.id}`);
              continue;
            }
            
            const history = await response.json();
            if (history.length === 0) {
              console.log(`No history for item ${item.id}`);
              continue;
            }
            
            // Sort history by date (oldest first)
            const sortedItemHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Get current value (most recent)
            const currentValue = sortedItemHistory[sortedItemHistory.length - 1];
            const itemCurrentDate = new Date(currentValue.date);
            
            // Calculate the target past date for this item based on its current date
            const itemPastTargetDate = new Date(itemCurrentDate.getTime() - days * 24 * 60 * 60 * 1000);
            
            // Find past value for the period
            let pastValue = null;
            for (let i = 0; i < sortedItemHistory.length; i++) {
              const historyDate = new Date(sortedItemHistory[i].date);
              if (historyDate <= itemPastTargetDate) {
                pastValue = sortedItemHistory[i];
              } else {
                break;
              }
            }
            
            // If no past value found or same as current, use the oldest value
            if (!pastValue || pastValue.date === currentValue.date) {
              if (sortedItemHistory.length > 1) {
                pastValue = sortedItemHistory[0];
              } else {
                // Only one data point for this item
                continue;
              }
            }
            
            const itemChange = currentValue.value - pastValue.value;
            
            console.log(`Item ${item.name}: ${pastValue.value} (${pastValue.date}) -> ${currentValue.value} (${currentValue.date}) = ${itemChange}`);
            
            // Include all items (even with 0 change) for debugging, but we can filter later
            itemBreakdown.push({
              name: item.name,
              type: item.type,
              change: itemChange,
              current: currentValue.value,
              previous: pastValue.value,
              currentDate: currentValue.date,
              previousDate: pastValue.date
            });
          } catch (error) {
            console.error(`Error fetching history for item ${item.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error calculating item breakdown:', error);
    }

    console.log(`Final calculation for ${days} days:`, { change, breakdown, itemBreakdown });
    
    return { change, breakdown, itemBreakdown };
  };

  // Main calculation effect
  useEffect(() => {
    const calculateAllPeriods = async () => {
      console.log('calculateAllPeriods called');
      setLoading(true);

      try {
        const [dayData, weekData, monthData, yearData] = await Promise.all([
          calculatePeriodChange(1),
          calculatePeriodChange(7),
          calculatePeriodChange(30),
          calculatePeriodChange(365)
        ]);

        console.log('All period data calculated:', { dayData, weekData, monthData, yearData });

        setOverviewData({
          day: dayData,
          week: weekData,
          month: monthData,
          year: yearData
        });
      } catch (error) {
        console.error('Error calculating periods:', error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    // Run calculation whenever we have the basic data
    calculateAllPeriods();
  }, [netWorthHistory, items]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getChangeIcon = (change) => {
    if (change > 0) return '↗';
    if (change < 0) return '↘';
    return '→';
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Asset': return 'text-green-400';
      case 'Liability': return 'text-red-400';
      case 'Debt': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getTypeBadge = (type) => {
    const colors = {
      'Asset': 'bg-[#1a1a1a] text-green-400',
      'Liability': 'bg-[#1a1a1a] text-red-400',
      'Debt': 'bg-[#1a1a1a] text-orange-400'
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[type] || 'bg-gray-200 text-gray-600'}`}>
        {type}
      </span>
    );
  };

  const currentData = overviewData[selectedPeriod];
  const hasItemChanges = currentData.itemBreakdown.filter(item => item.change !== 0).length > 0;

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#0f0f0f] rounded-xl shadow-sm dark:shadow-none border border-gray-200 dark:border-transparent p-6 shadow-card dark:shadow-card-none">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Financial Overview</h2>
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  const getPeriodLabel = (key) => {
    const labels = {
      'day': 'Last Day',
      'week': 'Last Week', 
      'month': 'Last Month',
      'year': 'Last Year'
    };
    return labels[key] || key;
  };

  return (
    <div className="bg-white dark:bg-[#0f0f0f] rounded-xl shadow-sm dark:shadow-none border border-gray-200 dark:border-transparent p-6 shadow-card dark:shadow-card-none">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Financial Overview</h2>
      
      {/* Period Selection */}
      <div className="flex space-x-2 mb-4">
        {[
          { key: 'day', label: 'Last Day' },
          { key: 'week', label: 'Last Week' },
          { key: 'month', label: 'Last Month' },
          { key: 'year', label: 'Last Year' }
        ].map(period => (
          <button
            key={period.key}
            onClick={() => setSelectedPeriod(period.key)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              selectedPeriod === period.key
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white'
                : 'bg-gray-50 dark:bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Net Worth Change */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">Net Worth Change</span>
          <div className={`flex items-center space-x-1 ${getChangeColor(currentData.change)}`}>
            <span className="text-lg font-bold">
              {currentData.change >= 0 ? '+' : '-'}{formatCurrency(currentData.change)}
            </span>
            <span className="text-sm">{getChangeIcon(currentData.change)}</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-2 mb-4">
        {currentData.breakdown.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">{item.category}</span>
            <div className={`flex items-center space-x-1 ${getChangeColor(item.change)}`}>
              <span className="font-medium">
                {item.change >= 0 ? '+' : '-'}{formatCurrency(item.change)}
              </span>
              <span className="text-xs">{getChangeIcon(item.change)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Details Toggle */}
      {hasItemChanges && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-left text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mb-2"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      )}

      {/* Individual Item Details */}
      {showDetails && hasItemChanges && (
        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-600">
          {currentData.itemBreakdown
            .filter(item => item.change !== 0)
            .map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                {getTypeBadge(item.type)}
              </div>
              <div className={`flex items-center space-x-1 ${getChangeColor(item.change)}`}>
                <span className="font-medium">
                  {item.change >= 0 ? '+' : '-'}{formatCurrency(item.change)}
                </span>
                <span className="text-xs">{getChangeIcon(item.change)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Changes Message */}
      {!hasItemChanges && (
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
          No changes for this period
        </div>
      )}
    </div>
  );
};

export default FinancialOverview; 