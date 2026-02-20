import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Scanner from './pages/Scanner'
import Results from './pages/Results'
import History from './pages/History'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen pb-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/results" element={<Results />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </div>
      <BottomNav />
    </BrowserRouter>
  )
}
