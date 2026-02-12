import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DashboardLayout = () => {
    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6 bg-muted/20">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
