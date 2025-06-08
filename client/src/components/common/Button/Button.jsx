import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ 
    children, 
    onClick, 
    disabled = false, 
    variant = 'primary',
    size = 'medium',
    className = '',
    type = 'button',
    loading = false,
    ...props 
}) => {
    const baseClasses = 'font-medium rounded-lg transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent';
    
    const variants = {
        primary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white focus:ring-purple-500',
        secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
        success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
        danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
        outline: 'border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white focus:ring-purple-500',
        ghost: 'text-purple-600 hover:bg-purple-100 focus:ring-purple-500'
    };

    const sizes = {
        small: 'px-3 py-1.5 text-sm',
        medium: 'px-4 py-2 text-base',
        large: 'px-6 py-3 text-lg'
    };

    const disabledClasses = 'opacity-50 cursor-not-allowed';
    const loadingClasses = 'cursor-wait';

    const buttonClasses = `
        ${baseClasses}
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.medium}
        ${disabled ? disabledClasses : ''}
        ${loading ? loadingClasses : ''}
        ${className}
    `.trim();

    const handleClick = (e) => {
        if (disabled || loading) return;
        onClick?.(e);
    };

    return (
        <motion.button
            type={type}
            className={buttonClasses}
            onClick={handleClick}
            disabled={disabled || loading}
            whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
            whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            {...props}
        >
            {loading ? (
                <div className="flex items-center space-x-2">
                    <motion.div
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>Загрузка...</span>
                </div>
            ) : (
                children
            )}
        </motion.button>
    );
};

export default Button;