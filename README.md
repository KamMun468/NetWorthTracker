# Net Worth Tracker

A full-stack web application for tracking personal net worth, assets, liabilities, and financial goals over time.

## Features

- **Asset & Liability Management**: Add, edit, and delete financial items with historical tracking
- **Interactive Charts**: Visualize net worth trends with line charts, step charts, and pie charts
- **Financial Overview**: View period-over-period changes (daily, weekly, monthly, yearly)
- **Goals Tracking**: Set and monitor financial goals with progress tracking
- **Date Range Filtering**: Filter charts by different time periods
- **Same-Date Updates**: Update values multiple times on the same date without creating duplicates
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- **React** - UI framework
- **Vite** - Build tool and dev server
- **Chart.js** with **react-chartjs-2** - Interactive charts
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **JSON file storage** - Simple data persistence
- **CORS** - Cross-origin resource sharing

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/NetWorthWebsite.git
cd NetWorthWebsite
```

2. Install dependencies for both client and server:
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### Running the Application

#### Option 1: Using the start script (recommended)
From the root directory:
```bash
npm start
```

This will start both the frontend and backend servers concurrently.

#### Option 2: Manual start
Start the backend server:
```bash
cd server
npm start
```

Start the frontend development server (in a new terminal):
```bash
cd client
npm run dev
```

### Accessing the Application

- **Frontend**: http://localhost:5175
- **Backend API**: http://localhost:5001

## Project Structure

```
NetWorthWebsite/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── package.json
│   └── vite.config.js
├── server/                 # Node.js backend
│   ├── index.js           # Express server
│   ├── data.json          # JSON database
│   └── package.json
├── logs/                   # Application logs
├── package.json           # Root package.json
└── README.md
```

## API Endpoints

### Items
- `GET /api/items` - Get all financial items
- `POST /api/items` - Create new item
- `PATCH /api/items/:id` - Update item name/type
- `DELETE /api/items/:id` - Delete item
- `GET /api/items/:id/history` - Get item value history
- `POST /api/items/:id/values` - Add/update item value

### Analytics
- `GET /api/net-worth-history` - Get net worth history for charts

### Goals
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create new goal
- `PATCH /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

## Features in Detail

### Financial Overview Component
- Shows period-over-period changes in net worth
- Displays detailed breakdowns of which items changed
- Supports multiple time periods (daily, weekly, monthly, yearly)
- Expandable item details with value changes

### Chart Types
- **Line Chart**: Shows net worth trends over time with gradient fills
- **Step Chart**: Shows stepped progression of values
- **Pie Chart**: Shows current asset/liability breakdown

### Timezone Handling
- All dates are stored in Eastern Daylight Time (EDT)
- Consistent date handling prevents timezone-related issues
- Same-date updates replace existing entries instead of creating duplicates

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Chart.js for excellent charting capabilities
- Tailwind CSS for rapid UI development
- React ecosystem for robust frontend development 