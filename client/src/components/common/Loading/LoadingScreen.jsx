import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = ({ message = 'Загрузка...', size = 'large' }) => {
    const sizes = {
        small: { container: 'w-8 h-8', text: 'text-sm' },
        medium: { container: 'w-12 h-12', text: 'text-base' },
        large: { container: 'w-16 h-16', text: 'text-lg' }
    };

    const currentSize = sizes[size] || sizes.large;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
            <motion.div
                className={`${currentSize.container} mb-4`}
                animate={{ 
                    rotate: 360,
                    scale: [1, 1.1, 1]
                }}
                transition={{ 
                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                    scale: { duration: 1, repeat: Infinity }
                }}
            >
                <div className="w-full h-full border-4 border-purple-500 border-t-transparent rounded-full"></div>
            </motion.div>
            
            <motion.p 
                className={`${currentSize.text} text-purple-200`}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                {message}
            </motion.p>

            <motion.div 
                className="mt-4 flex space-x-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                {[...Array(3)].map((_, index) => (
                    <motion.div
                        key={index}
                        className="w-2 h-2 bg-purple-400 rounded-full"
                        animate={{
                            y: [0, -10, 0],
                            opacity: [0.3, 1, 0.3]
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: index * 0.2
                        }}
                    />
                ))}
            </motion.div>
        </div>
    );
};

export default LoadingScreen;