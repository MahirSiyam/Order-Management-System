import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminRoute } from './components/auth/AdminRoute'
import { PrivateRoute } from './components/auth/PrivateRoute'
import { StaffRoute } from './components/auth/StaffRoute'
import { PageLoader } from './components/ui/LoadingSpinner'
import { AuthProvider } from './context/AuthProvider'

const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const SignupPage = lazy(() => import('./pages/auth/SignupPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const CreateOrderPage = lazy(() => import('./pages/CreateOrderPage'))
const RestockPage = lazy(() => import('./pages/RestockPage'))
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const ActivityLogsPage = lazy(() => import('./pages/ActivityLogsPage'))
const ManageUsersPage = lazy(() => import('./pages/ManageUsersPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function SuspensePage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export default function App() {
  useEffect(() => {
    document.getElementById('app-boot-splash')?.remove()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'rounded-xl text-sm shadow-lg',
              duration: 4000,
            }}
          />
          <Routes>
            <Route
              path="/login"
              element={
                <SuspensePage>
                  <LoginPage />
                </SuspensePage>
              }
            />
            <Route
              path="/signup"
              element={
                <SuspensePage>
                  <SignupPage />
                </SuspensePage>
              }
            />
            <Route
              path="/unauthorized"
              element={
                <PrivateRoute>
                  <SuspensePage>
                    <UnauthorizedPage />
                  </SuspensePage>
                </PrivateRoute>
              }
            />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <SuspensePage>
                    <DashboardPage />
                  </SuspensePage>
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <SuspensePage>
                    <ProfilePage />
                  </SuspensePage>
                </PrivateRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <PrivateRoute>
                  <StaffRoute>
                    <SuspensePage>
                      <CategoriesPage />
                    </SuspensePage>
                  </StaffRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/products"
              element={
                <PrivateRoute>
                  <StaffRoute>
                    <SuspensePage>
                      <ProductsPage />
                    </SuspensePage>
                  </StaffRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <PrivateRoute>
                  <SuspensePage>
                    <OrdersPage />
                  </SuspensePage>
                </PrivateRoute>
              }
            />
            <Route
              path="/orders/new"
              element={
                <PrivateRoute>
                  <SuspensePage>
                    <CreateOrderPage />
                  </SuspensePage>
                </PrivateRoute>
              }
            />
            <Route
              path="/restock"
              element={
                <PrivateRoute>
                  <StaffRoute>
                    <SuspensePage>
                      <RestockPage />
                    </SuspensePage>
                  </StaffRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/activity"
              element={
                <PrivateRoute>
                  <StaffRoute>
                    <SuspensePage>
                      <ActivityLogsPage />
                    </SuspensePage>
                  </StaffRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/users"
              element={
                <PrivateRoute>
                  <AdminRoute>
                    <SuspensePage>
                      <ManageUsersPage />
                    </SuspensePage>
                  </AdminRoute>
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
