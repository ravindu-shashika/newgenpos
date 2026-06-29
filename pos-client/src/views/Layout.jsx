import React from 'react';
import Sidebar from './layout/Sidebar';
import TopHead from './layout/TopHead';

export default function Layout({ children, user }) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f6fa' }}>
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <TopHead user={user} />
                <main style={{ flex: 1, paddingBottom: 24 }}>{children}</main>
            </div>
        </div>
    );
}
