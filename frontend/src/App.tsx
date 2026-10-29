import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { LoginPage } from './pages/LoginPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { CustomerRegisterPage } from './pages/CustomerRegisterPage';
import { ProviderRegisterPage } from './pages/ProviderRegisterPage';
import { ServicesPage } from './pages/ServicesPage';
import { AIAssistantPage } from './pages/AIAssistantPage';

import { CustomerDashboard } from './pages/CustomerDashboard';
import { CustomerBookings } from './pages/CustomerBookings';
import { CustomerTracking } from './pages/CustomerTracking';
import { CustomerPayments } from './pages/CustomerPayments';
import { CustomerProfile } from './pages/CustomerProfile';

import { ProviderDashboard } from './pages/ProviderDashboard';
import { ProviderServicesPage } from './pages/ProviderServicesPage';
import { ProviderActiveJobPage } from './pages/ProviderActiveJobPage';
import { ProviderEarningsPage } from './pages/ProviderEarningsPage';
import { ProviderHistoryPage } from './pages/ProviderHistoryPage';
import { ProviderReviewsPage } from './pages/ProviderReviewsPage';
import { ProviderProfilePage } from './pages/ProviderProfile';

import { AdminDashboard } from './pages/AdminDashboard';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <SocketProvider>
            <Router>
              <Routes>
                <Route element={<MainLayout />}>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/admin/login" element={<AdminLoginPage />} />
                  <Route path="/register" element={<CustomerRegisterPage />} />
                  <Route path="/register-provider" element={<ProviderRegisterPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/ai-assistant" element={<AIAssistantPage />} />

                  {/* Customer Routes */}
                  <Route
                    path="/customer/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['CUSTOMER']}>
                        <CustomerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/customer/bookings"
                    element={
                      <ProtectedRoute allowedRoles={['CUSTOMER']}>
                        <CustomerBookings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/customer/track"
                    element={
                      <ProtectedRoute allowedRoles={['CUSTOMER']}>
                        <CustomerTracking />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/customer/payments"
                    element={
                      <ProtectedRoute allowedRoles={['CUSTOMER']}>
                        <CustomerPayments />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/customer/profile"
                    element={
                      <ProtectedRoute allowedRoles={['CUSTOMER']}>
                        <CustomerProfile />
                      </ProtectedRoute>
                    }
                  />

                  {/* Provider Routes */}
                  <Route
                    path="/provider/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['PROVIDER']}>
                        <ProviderDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/provider/services"
                    element={
                      <ProtectedRoute allowedRoles={['PROVIDER']}>
                        <ProviderServicesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/provider/active-job"
                    element={
                      <ProtectedRoute allowedRoles={['PROVIDER']}>
                        <ProviderActiveJobPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/provider/earnings"
                    element={
                      <ProtectedRoute allowedRoles={['PROVIDER']}>
                        <ProviderEarningsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/provider/history"
                    element={
                      <ProtectedRoute allowedRoles={['PROVIDER']}>
                        <ProviderHistoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/provider/reviews"
                    element={
                      <ProtectedRoute allowedRoles={['PROVIDER']}>
                        <ProviderReviewsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/provider/profile"
                    element={
                      <ProtectedRoute allowedRoles={['PROVIDER']}>
                        <ProviderProfilePage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin Routes */}
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback Catch-all */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </Router>
          </SocketProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
