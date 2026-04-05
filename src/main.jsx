import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import router from './routes/routes'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster 
        position="top-center"
        gutter={12}
        toastOptions={{
          duration: 3000,
          style: {
            padding: '14px 20px',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: '700',
            maxWidth: '420px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          },
          success: {
            iconTheme: { primary: '#f97316', secondary: '#fff' },
            style: {
              background: '#fff7ed',
              border: '1.5px solid #fed7aa',
              color: '#9a3412',
            },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
            style: {
              background: '#fef2f2',
              border: '1.5px solid #fecaca',
              color: '#991b1b',
            },
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
)
