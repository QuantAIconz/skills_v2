// src/components/common/LoadingSpinner.jsx
import { useState, useEffect } from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  variant = 'primary', 
  text = 'Loading...',
  showText = true,
  fullScreen = false 
}) => {
  const [progress, setProgress] = useState(0);
  const [showTips, setShowTips] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);

  // Tips to display during loading
  const loadingTips = [
    "Preparing your assessment...",
    "Almost there...",
    "Good things take time...",
    "Getting everything ready for you...",
    "Your content is on the way..."
  ];

  // Progress simulation
  useEffect(() => {
    if (progress < 100) {
      const timer = setTimeout(() => {
        setProgress(prev => Math.min(prev + Math.random() * 5, 95));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  // Show tips after a delay
  useEffect(() => {
    const tipTimer = setTimeout(() => {
      setShowTips(true);
    }, 3000);

    return () => clearTimeout(tipTimer);
  }, []);

  // Rotate through tips
  useEffect(() => {
    if (showTips) {
      const tipInterval = setInterval(() => {
        setCurrentTip(prev => (prev + 1) % loadingTips.length);
      }, 4000);
      
      return () => clearInterval(tipInterval);
    }
  }, [showTips, loadingTips.length]);

  // Size classes
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-16 h-16',
    large: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  // Variant classes
  const variantClasses = {
    primary: 'text-blue-600',
    secondary: 'text-purple-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600'
  };

  // Animation variants
  const spinnerVariants = [
    'animate-spin rounded-full border-b-2 border-t-2',
    'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
    'animate-pulse'
  ];

  const SpinnerContent = () => (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Main spinner */}
      <div className="relative">
        {/* Outer ring with gradient */}
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-blue-400 to-purple-500 p-1`}>
          {/* Inner spinner with animation */}
          <div className={`flex h-full w-full items-center justify-center rounded-full bg-white`}>
            <div className={`${sizeClasses[size]} ${spinnerVariants[0]} ${variantClasses[variant]}`}></div>
            
            {/* Pulsing effect */}
            <div className={`${sizeClasses[size]} ${spinnerVariants[1]} ${variantClasses[variant]}`}></div>
          </div>
        </div>
        
        {/* Center icon or progress */}
        <div className="absolute inset-0 flex items-center justify-center">
          {progress > 0 && (
            <span className={`text-xs font-bold ${variantClasses[variant]}`}>
              {Math.round(progress)}%
            </span>
          )}
        </div>
      </div>

      {/* Loading text and tips */}
      <div className="text-center space-y-2">
        {showText && (
          <p className="text-gray-700 font-medium">{text}</p>
        )}
        
        {/* Progress bar */}
        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Tips that appear after a delay */}
        {showTips && (
          <div className="pt-2 transition-opacity duration-500">
            <p className="text-sm text-gray-500 italic animate-pulse">
              {loadingTips[currentTip]}
            </p>
          </div>
        )}
      </div>

      {/* Interactive elements */}
      <div className="flex space-x-2 pt-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          ></div>
        ))}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
        <SpinnerContent />
      </div>
    );
  }

  return <SpinnerContent />;
};

// Dot spinner variant for inline loading
export const DotSpinner = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-2 h-2',
    medium: 'w-3 h-3',
    large: 'w-4 h-4'
  };

  return (
    <div className="flex space-x-1">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-bounce`}
          style={{ animationDelay: `${i * 0.1}s` }}
        ></div>
      ))}
    </div>
  );
};

// Skeleton loader for content placeholders
export const SkeletonLoader = ({ lines = 3, variant = 'default' }) => {
  const variants = {
    default: 'bg-gradient-to-r from-gray-200 to-gray-300',
    card: 'bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg'
  };

  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className={`h-4 ${variants[variant]} rounded`}
          style={{ width: `${100 - (i * 10)}%` }}
        ></div>
      ))}
    </div>
  );
};

export default LoadingSpinner;