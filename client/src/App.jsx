import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import MainDashboard from './components/MainDashboard';
import AddItemModal from './components/AddItemModal';
import ItemHistoryModal from './components/ItemHistoryModal';
import UpdateValueModal from './components/UpdateValueModal';
import EditNameModal from './components/EditNameModal';

const API_BASE = 'http://localhost:5001/api';

function App() {
  const [items, setItems] = useState([]);
  const [netWorthHistory, setNetWorthHistory] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Fetch items from API
  const fetchItems = async () => {
    try {
      const response = await axios.get(`${API_BASE}/items`);
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  // Fetch net worth history for charts
  const fetchNetWorthHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE}/net-worth-history`);
      setNetWorthHistory(response.data);
    } catch (error) {
      console.error('Error fetching net worth history:', error);
    }
  };

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchItems(), fetchNetWorthHistory()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Dark mode effect
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Add new item
  const handleAddItem = async (itemData) => {
    try {
      const response = await axios.post(`${API_BASE}/items`, itemData);
      await fetchItems();
      await fetchNetWorthHistory();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  // Update item value
  const handleUpdateValue = async (itemId, newValue, customDate = null) => {
    try {
      const requestData = { value: newValue };
      if (customDate) {
        requestData.date = customDate;
      }
      await axios.post(`${API_BASE}/items/${itemId}/values`, requestData);
      await fetchItems();
      await fetchNetWorthHistory();
      setShowUpdateModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating value:', error);
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId) => {
    try {
      console.log('Deleting item with ID:', itemId);
      const response = await axios.delete(`${API_BASE}/items/${itemId}`);
      console.log('Delete response:', response.data);
      await fetchItems();
      await fetchNetWorthHistory();
      console.log('Items refreshed after delete');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  // Show item history
  const handleShowHistory = (item) => {
    setSelectedItem(item);
    setShowHistoryModal(true);
  };

  // Show update value modal
  const handleShowUpdateModal = (item) => {
    setSelectedItem(item);
    setShowUpdateModal(true);
  };

  // Update item name
  const handleUpdateItemName = async (itemId, newName) => {
    try {
      await axios.patch(`${API_BASE}/items/${itemId}`, { name: newName });
      await fetchItems();
      setShowEditNameModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating item name:', error);
      throw error;
    }
  };

  // Show edit name modal
  const handleShowEditNameModal = (item) => {
    setSelectedItem(item);
    setShowEditNameModal(true);
  };

  // Update item type
  const handleTypeChange = async (itemId, newType) => {
    try {
      console.log('App.jsx: Updating item type for itemId:', itemId, 'to:', newType);
      console.log('App.jsx: Making PATCH request to:', `${API_BASE}/items/${itemId}`);
      console.log('App.jsx: Request body:', { type: newType });
      
      const response = await axios.patch(`${API_BASE}/items/${itemId}`, { type: newType });
      console.log('App.jsx: Type update response:', response.data);
      await fetchItems();
      await fetchNetWorthHistory();
      console.log('App.jsx: Data refreshed after type change');
    } catch (error) {
      console.error('Error updating item type - Full error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      throw error;
    }
  };

  // Calculate summary stats
  const calculateSummaryStats = () => {
    const totalAssets = items
      .filter(item => item.type === 'Asset')
      .reduce((sum, item) => sum + item.currentValue, 0);
    
    const totalLiabilities = items
      .filter(item => item.type === 'Liability')
      .reduce((sum, item) => sum + item.currentValue, 0);
    
    const totalDebt = items
      .filter(item => item.type === 'Debt')
      .reduce((sum, item) => sum + item.currentValue, 0);
    
    const netWorth = totalAssets - totalLiabilities - totalDebt;

    return { totalAssets, totalLiabilities, totalDebt, netWorth };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-xl font-semibold text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  const summaryStats = calculateSummaryStats();

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-[#191919]">
      {/* Dark Mode Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {darkMode ? (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </button>

      {/* Left Sidebar */}
      <div className="w-1/4 min-w-80 bg-white dark:bg-[#151515] shadow-lg border-r border-gray-200 dark:border-gray-600">
        <Sidebar
          items={items}
          onItemClick={handleShowHistory}
          onUpdateClick={handleShowUpdateModal}
          onDeleteClick={handleDeleteItem}
          onEditName={handleShowEditNameModal}
          onTypeChange={handleTypeChange}
        />
      </div>

      {/* Main Dashboard */}
      <div className="flex-1 overflow-hidden">
        <MainDashboard
          summaryStats={summaryStats}
          netWorthHistory={netWorthHistory}
        />
      </div>

      {/* Add Button - Fixed position */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 right-8 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-colors duration-200"
        title="Add new item"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Modals */}
      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddItem}
        />
      )}

      {showHistoryModal && selectedItem && (
        <ItemHistoryModal
          item={selectedItem}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedItem(null);
          }}
        />
      )}

      {showUpdateModal && selectedItem && (
        <UpdateValueModal
          item={selectedItem}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedItem(null);
          }}
          onUpdate={handleUpdateValue}
        />
      )}

      {showEditNameModal && selectedItem && (
        <EditNameModal
          item={selectedItem}
          onClose={() => {
            setShowEditNameModal(false);
            setSelectedItem(null);
          }}
          onUpdate={handleUpdateItemName}
        />
      )}
    </div>
  );
}

export default App;
