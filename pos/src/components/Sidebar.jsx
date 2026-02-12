import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    Settings,
    BarChart,
    FileText
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import clsx from 'clsx';

const Sidebar = () => {
    const { theme } = useTheme();

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { name: 'POS', icon: ShoppingCart, path: '/pos' },
        { name: 'Products', icon: Package, path: '/products' },
        { name: 'Customers', icon: Users, path: '/customers' },
        { name: 'Reports', icon: BarChart, path: '/reports' },
        { name: 'Invoices', icon: FileText, path: '/invoices' },
        { name: 'Settings', icon: Settings, path: '/settings' },
    ];

    return (
        <aside className="w-64 border-r bg-card text-card-foreground flex flex-col h-screen sticky top-0 transition-colors duration-300">
            <div className="h-16 flex items-center justify-center border-b px-6">
                <span className="text-xl font-bold text-primary">POS Admin</span>
            </div>
            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-3">
                    {menuItems.map((item) => (
                        <li key={item.name}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    clsx(
                                        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                                        isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                    )
                                }
                            >
                                <item.icon className="h-5 w-5" />
                                <span>{item.name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        A
                    </div>
                    <div>
                        <p className="text-sm font-medium">Admin User</p>
                        <p className="text-xs text-muted-foreground">admin@pos.com</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
