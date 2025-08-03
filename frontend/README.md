# Call Grader Frontend

A modern React application for call center quality assurance and evaluation.

## Features

### 🎯 Dashboard
- **Overview Tab**: Key metrics and statistics at a glance
  - Total calls count
  - Total evaluations count
  - Average score
  - Recent calls (last 7 days)
  - Recent calls grid with quick access
- **Calls Tab**: Complete list of all calls with search functionality
- **Evaluations Tab**: All evaluations with pass/fail status and scores
- **Metrics Tab**: Performance analytics and charts (placeholder for future implementation)

### 📊 Modern UI
- Sleek, modern design with gradient backgrounds
- Responsive layout that works on all devices
- Tab-based navigation for easy switching between views
- Card-based layouts with hover effects
- Clean typography and spacing

### 🔍 Navigation
- Header navigation bar with Dashboard and Calls links
- Active state indicators
- Mobile-responsive navigation

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## Project Structure

```
src/
├── pages/
│   ├── DashboardPage.jsx    # Main dashboard with tabs
│   ├── CallListPage.jsx     # Calls list page
│   ├── CallDetailPage.jsx   # Individual call details
│   └── EvaluationPage.jsx   # Evaluation details
├── services/
│   └── api.js              # API service functions
├── App.jsx                 # Main app component with routing
└── App.css                 # Modern styling
```

## API Endpoints

The frontend communicates with the backend API:

- `GET /api/calls` - Get all calls
- `GET /api/calls/:id` - Get call details
- `GET /api/evaluations` - Get all evaluations
- `GET /api/evaluations/:id` - Get evaluation details
- `GET /api/dashboard/stats` - Get dashboard statistics

## Technologies Used

- **React 18** with hooks
- **React Router** for navigation
- **Axios** for API communication
- **CSS3** with modern features (Grid, Flexbox, Gradients)
- **Vite** for fast development and building

## Design Features

- **Color Scheme**: Modern purple gradient theme
- **Typography**: Clean, readable fonts
- **Layout**: Responsive grid and flexbox layouts
- **Interactions**: Smooth hover effects and transitions
- **Cards**: Elevated card design with shadows
- **Icons**: Emoji icons for visual appeal
