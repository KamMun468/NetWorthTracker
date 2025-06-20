const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 5001;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize data file if it doesn't exist
const initializeDataFile = async () => {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    // File doesn't exist, create it with initial structure
    const initialData = {
      items: [],
      valueHistory: [],
      goals: []
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
};

// Helper functions
const readData = async () => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data:', error);
    return { items: [], valueHistory: [], goals: [] };
  }
};

const writeData = async (data) => {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing data:', error);
    throw error;
  }
};

// Routes

// Get all items with their current values
app.get('/api/items', async (req, res) => {
  try {
    const data = await readData();
    
    // Calculate current values for each item
    const itemsWithCurrentValues = data.items.map(item => {
      const itemHistory = data.valueHistory
        .filter(entry => entry.itemId === item.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      const currentValue = itemHistory.length > 0 ? itemHistory[0].value : item.initialValue;
      const lastUpdated = itemHistory.length > 0 ? itemHistory[0].date : item.createdAt;
      
      return {
        ...item,
        currentValue,
        lastUpdated
      };
    });
    
    res.json(itemsWithCurrentValues);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Add new item
app.post('/api/items', async (req, res) => {
  try {
    const { name, initialValue, type, customDate } = req.body;
    const data = await readData();
    
    const newItem = {
      id: Date.now().toString(),
      name,
      initialValue: parseFloat(initialValue),
      type,
      createdAt: new Date().toISOString()
    };
    
    data.items.push(newItem);
    
    // Add initial value to history
    const initialHistoryEntry = {
      id: Date.now().toString() + '_init',
      itemId: newItem.id,
      value: parseFloat(initialValue),
      date: customDate || (() => {
        // Create current date in Eastern Time (EDT is UTC-4, EST is UTC-5)
        const now = new Date();
        // EDT is UTC-4, so we subtract 4 hours from UTC to get EDT
        const edt = new Date(now.getTime() - (4 * 60 * 60 * 1000));
        
        // Set to noon EDT (which is 4 PM UTC)
        const edtDate = new Date(Date.UTC(edt.getUTCFullYear(), edt.getUTCMonth(), edt.getUTCDate(), 16, 0, 0));
        return edtDate.toISOString();
      })()
    };
    
    data.valueHistory.push(initialHistoryEntry);
    
    await writeData(data);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update item value (adds new history entry or updates existing one for same date)
app.post('/api/items/:id/values', async (req, res) => {
  try {
    const { id } = req.params;
    const { value, date } = req.body;
    const data = await readData();
    
    const targetDate = date || (() => {
      // Create current date in Eastern Time (EDT is UTC-4, EST is UTC-5)
      const now = new Date();
      // EDT is UTC-4, so we subtract 4 hours from UTC to get EDT
      const edt = new Date(now.getTime() - (4 * 60 * 60 * 1000));
      
      // Set to noon EDT (which is 4 PM UTC)
      const edtDate = new Date(Date.UTC(edt.getUTCFullYear(), edt.getUTCMonth(), edt.getUTCDate(), 16, 0, 0));
      return edtDate.toISOString();
    })();
    
    // Get just the date part for comparison (YYYY-MM-DD)
    const targetDateOnly = targetDate.split('T')[0];
    
    // Check if there's already an entry for this item on this date
    const existingEntryIndex = data.valueHistory.findIndex(entry => {
      const entryDateOnly = entry.date.split('T')[0];
      return entry.itemId === id && entryDateOnly === targetDateOnly;
    });
    
    if (existingEntryIndex !== -1) {
      // Update existing entry
      data.valueHistory[existingEntryIndex].value = parseFloat(value);
      data.valueHistory[existingEntryIndex].date = targetDate;
      
      await writeData(data);
      res.status(200).json(data.valueHistory[existingEntryIndex]);
    } else {
      // Create new entry
      const newHistoryEntry = {
        id: Date.now().toString(),
        itemId: id,
        value: parseFloat(value),
        date: targetDate
      };
      
      data.valueHistory.push(newHistoryEntry);
      await writeData(data);
      res.status(201).json(newHistoryEntry);
    }
  } catch (error) {
    console.error('Error updating item value:', error);
    res.status(500).json({ error: 'Failed to update item value' });
  }
});

// Update item (name and/or type)
app.patch('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body;
    const data = await readData();
    
    const itemIndex = data.items.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Update name if provided
    if (name !== undefined) {
      data.items[itemIndex].name = name.trim();
    }
    
    // Update type if provided
    if (type !== undefined) {
      if (['Asset', 'Liability', 'Debt'].includes(type)) {
        data.items[itemIndex].type = type;
      } else {
        return res.status(400).json({ error: 'Invalid type. Must be Asset, Liability, or Debt' });
      }
    }
    
    await writeData(data);
    
    res.json(data.items[itemIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete item
app.delete('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting item with ID:', id);
    const data = await readData();
    
    const itemsBefore = data.items.length;
    const historyBefore = data.valueHistory.length;
    
    // Remove item from items array
    data.items = data.items.filter(item => item.id !== id);
    
    // Remove all value history for this item
    data.valueHistory = data.valueHistory.filter(entry => entry.itemId !== id);
    
    console.log(`Items: ${itemsBefore} -> ${data.items.length}, History: ${historyBefore} -> ${data.valueHistory.length}`);
    
    await writeData(data);
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Get value history for a specific item
app.get('/api/items/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await readData();
    
    const history = data.valueHistory
      .filter(entry => entry.itemId === id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch item history' });
  }
});

// Get net worth history for charts
app.get('/api/net-worth-history', async (req, res) => {
  try {
    const data = await readData();
    
    // Group all value entries by date
    const dateGroups = {};
    
    data.valueHistory.forEach(entry => {
      const date = entry.date.split('T')[0]; // Get just the date part
      if (!dateGroups[date]) {
        dateGroups[date] = {};
      }
      dateGroups[date][entry.itemId] = entry.value;
    });
    
    // Calculate net worth for each date
    const netWorthHistory = Object.keys(dateGroups)
      .sort()
      .map(date => {
        let totalAssets = 0;
        let totalLiabilities = 0;
        let totalDebt = 0;
        
        data.items.forEach(item => {
          // Get the most recent value for this item on or before this date
          const itemHistory = data.valueHistory
            .filter(entry => entry.itemId === item.id && entry.date.split('T')[0] <= date)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
          
          // Only include this item if it existed on or before this date
          // (i.e., it has at least one history entry on or before this date)
          if (itemHistory.length > 0) {
            const value = itemHistory[0].value;
            
            if (item.type === 'Asset') {
              totalAssets += value;
            } else if (item.type === 'Liability') {
              totalLiabilities += value;
            } else if (item.type === 'Debt') {
              totalDebt += value;
            }
          }
        });
        
        return {
          date,
          totalAssets,
          totalLiabilities,
          totalDebt,
          netWorth: totalAssets - totalLiabilities - totalDebt
        };
      });
    
    res.json(netWorthHistory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch net worth history' });
  }
});

// Goals endpoints

// Get all goals
app.get('/api/goals', async (req, res) => {
  try {
    const data = await readData();
    res.json(data.goals || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Add new goal
app.post('/api/goals', async (req, res) => {
  try {
    const { name, type, targetValue, targetDate } = req.body;
    const data = await readData();
    
    if (!data.goals) {
      data.goals = [];
    }
    
    const newGoal = {
      id: Date.now().toString(),
      name,
      type,
      targetValue: parseFloat(targetValue),
      targetDate,
      currentProgress: type === 'cash' ? 0 : undefined,
      createdAt: new Date().toISOString()
    };
    
    data.goals.push(newGoal);
    await writeData(data);
    
    res.status(201).json(newGoal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Delete goal
app.delete('/api/goals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await readData();
    
    if (!data.goals) {
      data.goals = [];
    }
    
    data.goals = data.goals.filter(goal => goal.id !== id);
    await writeData(data);
    
    res.status(200).json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// Update Cash goal progress
app.post('/api/goals/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const data = await readData();
    
    if (!data.goals) {
      data.goals = [];
    }
    
    const goalIndex = data.goals.findIndex(goal => goal.id === id);
    if (goalIndex === -1) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    const goal = data.goals[goalIndex];
    if (goal.type !== 'cash') {
      return res.status(400).json({ error: 'Progress can only be updated for Cash goals' });
    }
    
    // Add the amount to current progress
    goal.currentProgress = (goal.currentProgress || 0) + parseFloat(amount);
    
    await writeData(data);
    
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update goal progress' });
  }
});

// Initialize and start server
const startServer = async () => {
  await initializeDataFile();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer(); 