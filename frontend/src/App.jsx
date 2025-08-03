import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import CallListPage from './pages/CallListPage'
import CallDetailPage from './pages/CallDetailPage'
import EvaluationPage from './pages/EvaluationPage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <header className="header">
          <h1>Call Grader</h1>
        </header>
        <main className="main">
          <Routes>
            <Route path="/" element={<CallListPage />} />
            <Route path="/calls/:id" element={<CallDetailPage />} />
            <Route path="/evaluations/:id" element={<EvaluationPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
