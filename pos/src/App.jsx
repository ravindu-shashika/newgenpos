import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layout/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Pos from './pages/Pos'
import { ThemeProvider } from './context/ThemeContext'

// Placeholder for missing pages
const Placeholder = ({ title }) => (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p>This page is under construction.</p>
    </div>
);

function App() {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<DashboardLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="pos" element={<Pos />} />
                        <Route path="products" element={<Placeholder title="Products Management" />} />
                        <Route path="customers" element={<Placeholder title="Customers" />} />
                        <Route path="reports" element={<Placeholder title="Analytics & Reports" />} />
                        <Route path="invoices" element={<Placeholder title="Invoices" />} />
                        <Route path="settings" element={<Placeholder title="System Settings" />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    )
}

export default App
