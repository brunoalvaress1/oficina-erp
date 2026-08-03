import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppRoutes } from '@/routes/AppRoutes'
import { RaizRedirect } from '@/routes/RaizRedirect'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RaizRedirect />} />
      </Routes>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App