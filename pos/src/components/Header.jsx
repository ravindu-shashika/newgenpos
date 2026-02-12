import React from 'react';
import { Moon, Sun, Bell, Search } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Header = () => {
    const { theme, setTheme } = useTheme();

    return (
        <header className="h-16 border-b bg-card text-card-foreground px-6 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4 w-1/3">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="search"
                        placeholder="Search..."
                        className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="relative p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive"></span>
                </button>

                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? (
                        <Sun className="h-5 w-5" />
                    ) : (
                        <Moon className="h-5 w-5" />
                    )}
                </button>
            </div>
        </header>
    );
};

export default Header;
