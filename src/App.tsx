import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppRoutes } from '@/routes/AppRoutes'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App