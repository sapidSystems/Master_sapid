import React from 'react';

/**
 * A reusable loading spinner component that matches the design requested by the user.
 * 
 * @param {string} message - The loading message to display below the spinner.
 * @param {boolean} fullPage - If true, the spinner will be centered in a full-page container.
 * @param {string} minHeight - The minimum height of the container (default: '450px').
 */
const LoadingSpinner = ({ message = 'Loading data...', fullPage = false, minHeight = '450px' }) => {
  const containerClasses = fullPage 
    ? "fixed inset-0 flex flex-col items-center justify-center bg-white/80 z-50 backdrop-blur-sm"
    : `flex justify-center flex-col items-center min-h-[${minHeight}] w-full py-12`;

  return (
    <div className={containerClasses}>
      <div className="relative">
        {/* Outer dashed spinner */}
        <div className="w-12 h-12 border-4 border-gold-500 border-dashed rounded-full animate-spin"></div>
        
        {/* Inner solid pulse (optional flair) */}
        <div className="absolute inset-2 bg-cream-200 rounded-full animate-pulse opacity-60"></div>
      </div>
      
      <div className="mt-6 flex flex-col items-center space-y-2">
        <span className="text-sm font-bold text-leather-900 uppercase tracking-[0.2em] animate-pulse font-serif">
          {message}
        </span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
