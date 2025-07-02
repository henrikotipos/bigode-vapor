import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Layout } from './components/layout/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Products } from './pages/Products'
import { Categories } from './pages/Categories'
import { Orders } from './pages/Orders'
import { Kanban } from './pages/Kanban'
import { Menu } from './pages/Menu'
import { WhatsApp } from './pages/WhatsApp'
import { OrderTracking } from './pages/OrderTracking'
import { Deliveries } from './pages/Deliveries'
import { Users } from './pages/Users'
import { Reports } from './pages/Reports'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            
            {/* Main Menu Route - Now the homepage */}
            <Route path="/" element={<Menu />} />
            <Route path="/menu" element={<Menu />} />
            
            {/* Public Order Tracking Route */}
            <Route path="/acompanhar/:orderId" element={<OrderTracking />} />
            
            {/* Admin Login Route */}
            <Route path="/admin/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            
            {/* Protected Admin Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/products" element={
              <ProtectedRoute>
                <Layout>
                  <Products />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/categories" element={
              <ProtectedRoute>
                <Layout>
                  <Categories />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/orders" element={
              <ProtectedRoute>
                <Layout>
                  <Orders />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/admin/kanban" element={
              <ProtectedRoute>
                <Layout>
                  <Kanban />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/admin/deliveries" element={
              <ProtectedRoute>
                <Layout>
                  <Deliveries />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/users" element={
              <ProtectedRoute>
                <Layout>
                  <Users />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/reports" element={
              <ProtectedRoute>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/admin/whatsapp" element={
              <ProtectedRoute>
                <Layout>
                  <WhatsApp />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/settings" element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-white">Configurações - Em desenvolvimento</div>
                </Layout>
              </ProtectedRoute>
            } />

            {/* Legacy redirects for old admin routes */}
            <Route path="/login" element={<Navigate to="/admin/login" replace />} />
            <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/products" element={<Navigate to="/admin/products" replace />} />
            <Route path="/categories" element={<Navigate to="/admin/categories" replace />} />
            <Route path="/orders" element={<Navigate to="/admin/orders" replace />} />
            <Route path="/kanban" element={<Navigate to="/admin/kanban" replace />} />
            <Route path="/whatsapp" element={<Navigate to="/admin/whatsapp" replace />} />
            <Route path="/deliveries" element={<Navigate to="/admin/deliveries" replace />} />
            <Route path="/users" element={<Navigate to="/admin/users" replace />} />
            <Route path="/reports" element={<Navigate to="/admin/reports" replace />} />
            <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
          </Routes>
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1F2937',
                color: '#F9FAFB',
                border: '1px solid #374151',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App