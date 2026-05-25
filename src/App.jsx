import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/dashboard/Dashboard'
import Appointments from './pages/appointments/Appointments'
import Orders from './pages/orders/Orders'
import Customers from './pages/customers/Customers'
import Services from './pages/services/Services'
import Settings from './pages/settings/Settings'
import QueueStatus from './pages/public/QueueStatus'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/q/:slug" element={<QueueStatus />} />
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/randevular" element={<Appointments />} />
          <Route path="/siparisler" element={<Orders />} />
          <Route path="/musteriler" element={<Customers />} />
          <Route path="/hizmetler" element={<Services />} />
          <Route path="/ayarlar" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
