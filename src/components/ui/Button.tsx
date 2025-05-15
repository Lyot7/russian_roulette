import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  isFullWidth?: boolean;
}

export default function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isFullWidth = false,
  disabled = false,
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  };

  const sizeClasses = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg',
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const widthClass = isFullWidth ? 'w-full' : '';

  return (
    <button
      className={`
        font-medium rounded-md transition-colors
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabledClasses}
        ${widthClass}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
} 