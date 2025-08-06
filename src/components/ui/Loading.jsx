import React, { useEffect, useState } from "react";
import { cn } from "@/utils/cn";

const Loading = ({ className, type = "skeleton", ...props }) => {
  const [animationReduced, setAnimationReduced] = useState(false);
  const [browserOptimized, setBrowserOptimized] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    setAnimationReduced(reducedMotion.matches);
    
    // Listen for changes
    const handleReducedMotionChange = (e) => {
      setAnimationReduced(e.matches);
    };
    
    reducedMotion.addEventListener('change', handleReducedMotionChange);
    
    // Browser-specific optimizations
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isOldBrowser = (
      (userAgent.includes('Chrome') && parseInt(userAgent.match(/Chrome\/(\d+)/)?.[1] || '0') < 60) ||
      (userAgent.includes('Firefox') && parseInt(userAgent.match(/Firefox\/(\d+)/)?.[1] || '0') < 55) ||
      (userAgent.includes('Safari') && !userAgent.includes('Chrome') && parseInt(userAgent.match(/Version\/(\d+)/)?.[1] || '0') < 11)
    );
    
    setBrowserOptimized(isMobile || isOldBrowser);
    
    return () => {
      reducedMotion.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);

  const animationClass = animationReduced ? "" : "animate-pulse";
  const skeletonCount = browserOptimized ? 8 : 12; // Reduce skeleton count on slower devices

  if (type === "spinner") {
    return (
      <div 
        className={cn("flex items-center justify-center p-8", className)} 
        {...props}
        role="status"
        aria-live="polite"
        aria-label="Loading content"
      >
        <div 
          className={cn(
            "rounded-full h-12 w-12 border-b-2 border-primary-600",
            !animationReduced && "animate-spin"
          )}
          aria-hidden="true"
        />
        <span className="sr-only">Loading, please wait...</span>
      </div>
    );
  }

  if (type === "products") {
    return (
      <div 
        className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", className)} 
        {...props}
        role="status"
        aria-live="polite"
        aria-label="Loading products"
      >
        {[...Array(skeletonCount)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-soft overflow-hidden">
            <div 
              className={cn(
                "aspect-square bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200",
                animationClass
              )}
              aria-hidden="true"
            />
            <div className="p-4 space-y-3">
              <div 
                className={cn(
                  "h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded",
                  animationClass
                )}
                aria-hidden="true"
              />
              <div 
                className={cn(
                  "h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4",
                  animationClass
                )}
                aria-hidden="true"
              />
              <div className="flex items-center space-x-2">
                <div 
                  className={cn(
                    "h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-20",
                    animationClass
                  )}
                  aria-hidden="true"
                />
                <div 
                  className={cn(
                    "h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-16",
                    animationClass
                  )}
                  aria-hidden="true"
                />
              </div>
              <div 
                className={cn(
                  "h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded",
                  animationClass
                )}
                aria-hidden="true"
              />
            </div>
          </div>
        ))}
        <span className="sr-only">Loading product information...</span>
      </div>
    );
  }

  if (type === "categories") {
    return (
      <div 
        className={cn("flex space-x-4 overflow-hidden", className)} 
        {...props}
        role="status"
        aria-live="polite"
        aria-label="Loading categories"
      >
        {[...Array(8)].map((_, index) => (
          <div key={index} className="flex-shrink-0 text-center">
            <div 
              className={cn(
                "w-16 h-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl mb-3",
                animationClass
              )}
              aria-hidden="true"
            />
            <div 
              className={cn(
                "h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-12",
                animationClass
              )}
              aria-hidden="true"
            />
          </div>
        ))}
        <span className="sr-only">Loading category information...</span>
      </div>
    );
  }

// Minimal admin loader (non-blocking)
  if (type === "admin-minimal") {
    return (
      <div 
        className="admin-mini-loader"
        role="status"
        aria-live="polite"
        aria-label="Loading..."
        {...props}
      >
        Loading...
        <span className="sr-only">Loading admin content...</span>
      </div>
    );
  }

  // Enhanced skeleton for admin dashboard
  if (type === "admin") {
    return (
      <div 
        className={cn("space-y-6", className)} 
        {...props}
        role="status"
        aria-live="polite"
        aria-label="Loading admin dashboard"
      >
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <div 
            className={cn(
              "h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-48",
              animationClass
            )}
            aria-hidden="true"
          />
          <div 
            className={cn(
              "h-10 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-32",
              animationClass
            )}
            aria-hidden="true"
          />
        </div>
        
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-soft">
              <div 
                className={cn(
                  "h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-20 mb-3",
                  animationClass
                )}
                aria-hidden="true"
              />
              <div 
                className={cn(
                  "h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-16",
                  animationClass
                )}
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
        
        <span className="sr-only">Loading admin dashboard data...</span>
      </div>
    );
  }

  // Default skeleton
  return (
    <div 
      className={cn("animate-pulse", className)} 
      {...props}
      role="status"
      aria-live="polite"
      aria-label="Loading content"
    >
      <div className="space-y-4">
        <div 
          className={cn(
            "h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-full",
            animationClass
          )}
          aria-hidden="true"
        />
        <div 
          className={cn(
            "h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-5/6",
            animationClass
          )}
          aria-hidden="true"
        />
        <div 
          className={cn(
            "h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-4/5",
            animationClass
          )}
          aria-hidden="true"
        />
</div>
      <span className="sr-only">Loading information...</span>
    </div>
  );
};

export default Loading;