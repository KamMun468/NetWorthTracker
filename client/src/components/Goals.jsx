import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5001/api';

const Goals = ({ summaryStats }) => {
  const [goals, setGoals] = useState([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalType, setGoalType] = useState('net-worth');
  const [targetValue, setTargetValue] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [showAddProgress, setShowAddProgress] = useState(null);
  const [progressAmount, setProgressAmount] = useState('');

  // Fetch goals from API
  const fetchGoals = async () => {
    try {
      const response = await axios.get(`${API_BASE}/goals`);
      setGoals(response.data);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  // Add new goal
  const handleAddGoal = async (e) => {
    e.preventDefault();
    console.log('Form submitted with:', { goalName, goalType, targetValue, targetDate });
    
    if (!goalName || !targetValue || !targetDate) {
      console.error('Missing required fields');
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      console.log('Sending request to:', `${API_BASE}/goals`);
      const response = await axios.post(`${API_BASE}/goals`, {
        name: goalName,
        type: goalType,
        targetValue: parseFloat(targetValue),
        targetDate: targetDate
      });
      console.log('Goal added successfully:', response.data);
      await fetchGoals();
      setShowAddGoal(false);
      setGoalName('');
      setGoalType('net-worth');
      setTargetValue('');
      setTargetDate('');
    } catch (error) {
      console.error('Error adding goal:', error);
      alert('Failed to add goal. Please try again.');
    }
  };

  // Delete goal
  const handleDeleteGoal = async (goalId) => {
    try {
      await axios.delete(`${API_BASE}/goals/${goalId}`);
      await fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  // Update Cash goal progress
  const handleUpdateProgress = async (goalId) => {
    if (!progressAmount || isNaN(progressAmount) || parseFloat(progressAmount) < 0) {
      alert('Please enter a valid positive amount');
      return;
    }

    try {
      await axios.post(`${API_BASE}/goals/${goalId}/progress`, {
        amount: parseFloat(progressAmount)
      });
      await fetchGoals();
      setShowAddProgress(null);
      setProgressAmount('');
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Failed to update progress. Please try again.');
    }
  };

  // Get current value for goal type
  const getCurrentValue = (type, goal = null) => {
    switch (type) {
      case 'net-worth':
        return summaryStats.netWorth;
      case 'total-assets':
        return summaryStats.totalAssets;
      case 'total-debt':
        return summaryStats.totalDebt;
      case 'total-liabilities':
        return summaryStats.totalLiabilities;
      case 'cash':
        return goal ? (goal.currentProgress || 0) : 0;
      default:
        return 0;
    }
  };

  // Calculate progress percentage
  const calculateProgress = (goal) => {
    const currentValue = getCurrentValue(goal.type, goal);
    const progress = (currentValue / goal.targetValue) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if goal is overdue
  const isOverdue = (targetDate) => {
    return new Date(targetDate) < new Date();
  };

  // Get goal type display name
  const getGoalTypeDisplay = (type) => {
    switch (type) {
      case 'net-worth':
        return 'Net Worth';
      case 'total-assets':
        return 'Total Assets';
      case 'total-debt':
        return 'Total Debt';
      case 'total-liabilities':
        return 'Total Liabilities';
      case 'cash':
        return 'Cash Savings';
      default:
        return type;
    }
  };

  return (
    <div className="bg-white dark:bg-[#0f0f0f] rounded-xl shadow-sm dark:shadow-none border border-gray-200 dark:border-transparent p-6 shadow-card dark:shadow-card-none">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white font-serif">Goals & Targets</h2>
        <button
          onClick={() => setShowAddGoal(!showAddGoal)}
          className="bg-[#f5f5f5] hover:bg-[#e5e5e5] dark:bg-transparent text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1 rounded"
          title="Add new goal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Add Goal Form */}
      {showAddGoal && (
        <form onSubmit={handleAddGoal} className="mb-6 p-4 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Goal Name
              </label>
              <input
                type="text"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-black text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-0"
                placeholder="e.g., Emergency Fund"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Goal Type
              </label>
              <select
                value={goalType}
                onChange={(e) => setGoalType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-black text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-0"
              >
                <option value="net-worth">Net Worth</option>
                <option value="total-assets">Total Assets</option>
                <option value="total-debt">Total Debt (Reduce)</option>
                <option value="total-liabilities">Total Liabilities (Reduce)</option>
                <option value="cash">Cash Savings</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Value
              </label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-black text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-0"
                placeholder="100000"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-black text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-0"
                required
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
              >
                Add Goal
              </button>
              <button
                type="button"
                onClick={() => setShowAddGoal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 py-2 px-3 rounded text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 text-sm">No goals set yet</div>
            <div className="text-gray-400 dark:text-gray-500 text-sm mt-1">Add your first financial goal</div>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = calculateProgress(goal);
            const currentValue = getCurrentValue(goal.type, goal);
            const isDebtType = goal.type === 'total-debt' || goal.type === 'total-liabilities';
            const isCashGoal = goal.type === 'cash';
            
            return (
              <div
                key={goal.id}
                className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                {/* Goal Header */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{goal.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {getGoalTypeDisplay(goal.type)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isCashGoal && (
                          <button
                            onClick={() => setShowAddProgress(showAddProgress === goal.id ? null : goal.id)}
                            className="bg-[#f5f5f5] hover:bg-[#e5e5e5] dark:bg-transparent text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300 transition-colors p-1 rounded"
                            title="Add progress"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="bg-[#f5f5f5] hover:bg-[#e5e5e5] dark:bg-transparent text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded"
                          title="Delete goal"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add Progress Form for Cash Goals */}
                {isCashGoal && showAddProgress === goal.id && (
                  <div className="mb-3 p-3 bg-gray-100 dark:bg-[#0f0f0f] rounded-lg">
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={progressAmount}
                        onChange={(e) => setProgressAmount(e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-black text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-0"
                        placeholder="Amount to add"
                        min="0"
                        step="0.01"
                      />
                      <button
                        onClick={() => handleUpdateProgress(goal.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowAddProgress(null);
                          setProgressAmount('');
                        }}
                        className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded text-sm transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        progress >= 100
                          ? 'bg-green-500'
                          : progress >= 75
                          ? 'bg-blue-500'
                          : progress >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Values */}
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Current: {formatCurrency(currentValue)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Target: {formatCurrency(goal.targetValue)}
                  </span>
                </div>

                {/* Target Date */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    Due: {formatDate(goal.targetDate)}
                  </span>
                  {isOverdue(goal.targetDate) && progress < 100 && (
                    <span className="text-red-500 font-medium">Overdue</span>
                  )}
                  {progress >= 100 && (
                    <span className="text-green-500 font-medium">✓ Achieved</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Goals; 