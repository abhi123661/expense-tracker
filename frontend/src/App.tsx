import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { AddExpense } from './pages/AddExpense'
import { EditExpense } from './pages/EditExpense'
import { History } from './pages/History'
import { SettingsPage } from './pages/Settings'
import { ToastProvider } from './components/Toast'
import { useTheme } from './hooks/useTheme'

function ThemeInitializer() {
  useTheme()
  return null
}

function App() {
  return (
    <ToastProvider>
      <ThemeInitializer />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddExpense />} />
            <Route path="/edit/:id" element={<EditExpense />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
