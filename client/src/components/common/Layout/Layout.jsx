import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Home, 
    Calendar, 
    Star, 
    History, 
    User, 
    Crown, 
    Users, 
    Hash, 
    Moon 
} from 'lucide-react';

const Layout = ({ children }) => {
    const location = useLocation();

    const navItems = [
        { 
            path: '/', 
            icon: Home, 
            label: 'Главная',
            color: 'text-purple-400'
        },
        { 
            path: '/daily', 
            icon: Calendar, 
            label: 'Карта дня',
            color: 'text-blue-400'
        },
        { 
            path: '/spreads', 
            icon: Star, 
            label: 'Расклады',
            color: 'text-pink-400'
        },
        { 
            path: '/numerology', 
            icon: Hash, 
            label: 'Нумерология',
            color: 'text-green-400'
        },
        { 
            path: '/lunar', 
            icon: Moon, 
            label: 'Лунный календарь',
            color: 'text-indigo-400'
        }
    ];

    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
            {/* Header */}
            <header className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20 px-4 py-3">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-2">
                        <motion.div
                            className="text-2xl"
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                            🔮
                        </motion.div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            MISTIKA
                        </h1>
                    </Link>

                    <div className="flex items-center space-x-4">
                        <Link 
                            to="/friends" 
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <Users size={20} />
                        </Link>
                        <Link 
                            to="/history" 
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <History size={20} />
                        </Link>
                        <Link 
                            to="/premium" 
                            className="text-yellow-400 hover:text-yellow-300 transition-colors"
                        >
                            <Crown size={20} />
                        </Link>
                        <Link 
                            to="/profile" 
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <User size={20} />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children || <Outlet />}
            </main>

            {/* Bottom Navigation */}
            <nav className="bg-black/30 backdrop-blur-sm border-t border-purple-500/20 p-4">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-around items-center">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);
                            
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className="flex flex-col items-center space-y-1 min-w-0 flex-1"
                                >
                                    <motion.div
                                        className={`p-2 rounded-full transition-colors ${
                                            active 
                                                ? `${item.color} bg-white/10` 
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                        whileTap={{ scale: 0.95 }}
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <Icon size={20} />
                                    </motion.div>
                                    <span 
                                        className={`text-xs transition-colors ${
                                            active 
                                                ? item.color 
                                                : 'text-gray-500'
                                        }`}
                                    >
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default Layout;