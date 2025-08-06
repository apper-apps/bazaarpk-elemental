import '@/index.css';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import Header from "@/components/organisms/Header";
import CartDrawer from "@/components/organisms/CartDrawer";
import ErrorComponent, { Error } from "@/components/ui/Error";
import UserManagement from "@/components/pages/UserManagement";
import AddRecipeBundle from "@/components/pages/AddRecipeBundle";
import Home from "@/components/pages/Home";
import AddProduct from "@/components/pages/AddProduct";
import ProductDetail from "@/components/pages/ProductDetail";
import OrderManagement from "@/components/pages/OrderManagement";
import Category from "@/components/pages/Category";
import RecipeBundlesPage from "@/components/pages/RecipeBundlesPage";
import ManageProducts from "@/components/pages/ManageProducts";
import Cart from "@/components/pages/Cart";
import AdminDashboard from "@/components/pages/AdminDashboard";
import ReportsAnalytics from "@/components/pages/ReportsAnalytics";
import { createSafeTimeout, performEmergencyCleanup, showEmergencyButton } from "@/utils/timeoutManager";
// Browser detection at module level to avoid re-computation
const detectBrowser = () => {
  const userAgent = navigator.userAgent;
  const browserInfo = {
    name: 'Unknown',
    version: 'Unknown',
    mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
    touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    screenReader: window.speechSynthesis !== undefined,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    highContrast: window.matchMedia('(prefers-contrast: high)').matches
  };

  // Browser detection
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browserInfo.name = 'Chrome';
    browserInfo.version = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.includes('Firefox')) {
    browserInfo.name = 'Firefox';
    browserInfo.version = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browserInfo.name = 'Safari';
    browserInfo.version = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.includes('Edg')) {
    browserInfo.name = 'Edge';
    browserInfo.version = userAgent.match(/Edg\/(\d+)/)?.[1] || 'Unknown';
  }

  return browserInfo;
};

// Static browser info - computed once
const BROWSER_INFO = detectBrowser();

function AppContent() {
  const navigate = useNavigate();
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [adminLoadProgress, setAdminLoadProgress] = useState(0);
  const [adminError, setAdminError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showForceExit, setShowForceExit] = useState(false);
  const [emergencyCleanup, setEmergencyCleanup] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({});

  // Refs to track component mount status and cleanup
  const isMountedRef = useRef(true);
  const cleanupRef = useRef(false);
  // Initialize performance monitoring only once
  useEffect(() => {
    console.log('🔍 Browser Compatibility Check:', BROWSER_INFO);
    
    // Track compatibility issues
    if (parseInt(BROWSER_INFO.version) < 80 && BROWSER_INFO.name === 'Chrome') {
      console.warn('⚠️ Chrome version may have compatibility issues');
    }

    // Performance monitoring setup
    const initPerformanceMonitoring = () => {
      if ('performance' in window) {
        const navigationTiming = performance.getEntriesByType('navigation')[0];
        if (navigationTiming && isMountedRef.current) {
          const metrics = {
            pageLoadTime: navigationTiming.loadEventEnd - navigationTiming.loadEventStart,
            domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.domContentLoadedEventStart,
            firstPaint: 0,
            firstContentfulPaint: 0
          };
          
          // Get paint timings
          const paintTimings = performance.getEntriesByType('paint');
          paintTimings.forEach(timing => {
            if (timing.name === 'first-paint') {
              metrics.firstPaint = timing.startTime;
            } else if (timing.name === 'first-contentful-paint') {
              metrics.firstContentfulPaint = timing.startTime;
            }
          });
          
          if (isMountedRef.current) {
            setPerformanceMetrics(metrics);
            console.log('📊 Performance Metrics:', metrics);
            
            // Track performance in analytics
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'page_performance', {
                page_load_time: Math.round(metrics.pageLoadTime),
                dom_content_loaded: Math.round(metrics.domContentLoaded),
                first_contentful_paint: Math.round(metrics.firstContentfulPaint),
                browser_name: BROWSER_INFO.name || 'unknown'
              });
            }
          }
        }
      }
    };

    const handleAdminMaskError = (e) => {
      if (!isMountedRef.current) return;

      // Enhanced console logging for debugging with browser context
      console.group('🔴 Admin Mask Persistence Error');
      console.error('Error Details:', {
        timestamp: new Date().toISOString(),
        errorType: e.detail?.type || 'unknown',
        errorMessage: e.detail?.message || 'No message provided',
        errorStack: e.detail?.error?.stack,
        currentRoute: window.location.pathname,
        userAgent: navigator.userAgent,
        browserInfo: BROWSER_INFO,
        screenInfo: {
          width: window.screen.width,
          height: window.screen.height,
          availWidth: window.screen.availWidth,
          availHeight: window.screen.availHeight,
          devicePixelRatio: window.devicePixelRatio
        },
        adminState: {
          isAdminRoute: window.location.pathname.includes('/admin'),
          hasAdminClass: document.body.classList.contains('admin-accessing'),
          adminElements: document.querySelectorAll('.admin-dashboard, [data-admin-content]').length
        }
      });
      console.groupEnd();
      
      // Track mask persistence errors in analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'admin_mask_persistence_error', {
          error_type: e.detail?.type || 'unknown',
          browser_name: BROWSER_INFO.name || 'unknown',
          browser_version: BROWSER_INFO.version || 'unknown',
          is_mobile: BROWSER_INFO.mobile || false,
          route: window.location.pathname,
          timestamp: Date.now()
        });
}
      
      // Dispatch enhanced custom event for error tracking
      try {
        const eventDetail = {
          type: 'mask_error',
          severity: 'high',
          data: e.detail,
          debugInfo: {
            route: window.location.pathname,
            timestamp: Date.now(),
            retryable: e.detail?.retryable !== false,
            browserInfo: BROWSER_INFO,
            performanceMetrics
          }
        };
        
        if (typeof CustomEvent === 'function') {
          window.dispatchEvent(new CustomEvent('admin_debug_log', { detail: eventDetail }));
        } else if (document.createEvent) {
          const event = document.createEvent('CustomEvent');
          event.initCustomEvent('admin_debug_log', false, false, eventDetail);
          window.dispatchEvent(event);
        }
      } catch (eventError) {
        console.warn('Failed to dispatch admin debug event:', eventError);
      }
    };

// Monitor console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      
      // Track console errors in analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'console_error', {
          error_message: args[0]?.toString() || 'Unknown error',
          browser_name: BROWSER_INFO.name || 'unknown',
          route: window.location.pathname,
          timestamp: Date.now()
        });
      }
    };

    // Global error handler for mask-related issues
    const handleGlobalError = (e) => {
      if (!isMountedRef.current) return;
      
      if (e.message.includes('mask') || e.message.includes('overlay')) {
        console.error('Mask-related error detected:', e);
        
        // Remove all potential blocking elements
        document.querySelectorAll('.overlay, .mask, .backdrop, .modal-backdrop').forEach(el => {
          el.remove();
        });
        
        // Track mask errors in analytics
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'mask_error_cleanup', {
            error_message: e.message,
            browser_name: BROWSER_INFO.name || 'unknown',
            route: window.location.pathname,
            timestamp: Date.now()
          });
}
        
        // Dispatch cleanup event
        try {
          const eventDetail = {
            type: 'global_error_handler',
            error: e.message,
            timestamp: Date.now()
          };
          
          if (typeof CustomEvent === 'function') {
            window.dispatchEvent(new CustomEvent('mask_cleanup_performed', { detail: eventDetail }));
          } else if (document.createEvent) {
            const event = document.createEvent('CustomEvent');
            event.initCustomEvent('mask_cleanup_performed', false, false, eventDetail);
            window.dispatchEvent(event);
          }
        } catch (eventError) {
          console.warn('Failed to dispatch mask cleanup event:', eventError);
        }
      }
    };

    // Periodically check for stuck masks
    const maskCleanupInterval = setInterval(() => {
      if (!isMountedRef.current) return;
      
      const masks = document.querySelectorAll('.mask, .overlay, .backdrop, .modal-backdrop');
      if (masks.length > 0) {
        console.warn('Stuck mask detected - removing:', masks.length, 'elements');
        
        masks.forEach(mask => {
          // Log mask details before removal
          console.log('Removing stuck mask:', {
            className: mask.className,
            id: mask.id,
            tagName: mask.tagName,
            style: mask.getAttribute('style')
          });
          mask.remove();
        });
        
        // Track periodic cleanup in analytics
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'periodic_mask_cleanup', {
            masks_removed: masks.length,
            browser_name: BROWSER_INFO.name || 'unknown',
            route: window.location.pathname,
            timestamp: Date.now()
          });
}
        
        // Dispatch cleanup event
        try {
          const eventDetail = {
            type: 'periodic_cleanup',
            masksRemoved: masks.length,
            timestamp: Date.now()
          };
          
          if (typeof CustomEvent === 'function') {
            window.dispatchEvent(new CustomEvent('periodic_mask_cleanup', { detail: eventDetail }));
          } else if (document.createEvent) {
            const event = document.createEvent('CustomEvent');
            event.initCustomEvent('periodic_mask_cleanup', false, false, eventDetail);
            window.dispatchEvent(event);
          }
        } catch (eventError) {
          console.warn('Failed to dispatch periodic cleanup event:', eventError);
        }
      }
    }, 5000);

    // Initialize monitoring
    initPerformanceMonitoring();
    window.addEventListener('admin_mask_error', handleAdminMaskError);
    window.addEventListener('error', handleGlobalError);

    // Cleanup on component unmount
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('admin_mask_error', handleAdminMaskError);
      window.removeEventListener('error', handleGlobalError);
      clearInterval(maskCleanupInterval);
      console.error = originalConsoleError;
    };
  }, []);
  
// Clear all admin timeouts utility
const clearAllAdminTimeouts = useCallback(() => {
  // Clear all potential timeout locks
  const timeoutIds = window.adminTimeoutIds || [];
  timeoutIds.forEach(id => clearTimeout(id));
  window.adminTimeoutIds = [];
  document.body.setAttribute('data-admin-timeouts-cleared', 'true');
}, []);

// Optimized admin verification without masks
const verifyAdminDirect = useCallback(async () => {
  // Skip mask-generating verification steps
  const token = localStorage.getItem('admin_token');
  if (!token) return false;
  
  // Direct API call without intermediate loading states
  try {
    const response = await fetch('/api/admin/verify', {
      method: 'HEAD',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}, []);

const handleAdminAccess = useCallback(async () => {
  // Prevent multiple simultaneous calls
  if (isAdminLoading || cleanupRef.current || !isMountedRef.current) return;
  
  const startTime = performance.now();
  cleanupRef.current = false;
  
  console.log('🔐 Starting optimized admin access...');
  
  // IMMEDIATELY remove any existing masks
  document.querySelectorAll('.overlay, .mask, .backdrop, .modal-backdrop, [class*="overlay"], [class*="mask"]').forEach(el => {
    el.remove();
  });
  
  // Clear any timeout locks immediately
  clearAllAdminTimeouts();
  
  // Show minimal loading indicator (not mask)
  const loader = document.createElement('div');
  loader.className = 'admin-mini-loader';
  loader.innerHTML = '🔐 Securing admin access...';
  document.body.appendChild(loader);
  
  setIsAdminLoading(true);
  setAdminLoadProgress(0);
  setAdminError(null);
  setShowForceExit(false);
  
  // Track admin access attempt
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'admin_access_optimized_attempt', {
      browser_name: BROWSER_INFO.name || 'unknown',
      browser_version: BROWSER_INFO.version || 'unknown',
      is_mobile: BROWSER_INFO.mobile || false,
      timestamp: Date.now()
    });
  }
  
  // Reduced timeout for faster response
  const timeoutDuration = BROWSER_INFO.mobile ? 3000 : 2000;
  
const timeoutId = createSafeTimeout(() => {
    if (cleanupRef.current || !isMountedRef.current) return;
    
    // Check if dashboard has loaded
    const dashboardLoaded = document.querySelector('.admin-dashboard');
    if (!dashboardLoaded) {
      console.warn('Dashboard timeout - forcing display');
      setEmergencyCleanup(true);
      performEmergencyCleanup();
      showEmergencyButton();
    }
    
    setShowForceExit(true);
    setAdminError(`Loading timeout - Dashboard taking longer than expected (${timeoutDuration/1000}s timeout)`);
    loader.innerHTML = `❌ Timeout reached <button onclick="window.location.reload()">Retry</button>`;
    
    // Track timeout events
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'admin_load_timeout_optimized', {
        timeout_duration: timeoutDuration,
        browser_name: BROWSER_INFO.name || 'unknown',
        is_mobile: BROWSER_INFO.mobile || false
      });
    }
  }, timeoutDuration);

  try {
    // Enhanced browser compatibility checks
    if (!window.fetch) {
      throw new Error('Browser does not support fetch API. Please update your browser.');
    }
    
    if (!window.localStorage) {
      throw new Error('Browser does not support localStorage. Please enable cookies and try again.');
    }
    
    // Ensure no overlays are blocking navigation
    document.body.classList.add('admin-accessing');
    document.body.classList.add('content-layer');
    
    // Add accessibility attributes
    document.body.setAttribute('aria-busy', 'true');
    document.body.setAttribute('aria-live', 'polite');
    
    // Update loader
    loader.innerHTML = '🔐 Checking permissions...';
    if (!cleanupRef.current && isMountedRef.current) setAdminLoadProgress(25);
    
    // Direct permission check (no mask-generating steps)
    const isAdmin = await verifyAdminDirect();
    if (!isAdmin) {
      loader.innerHTML = '🔐 Loading admin modules...';
    }
    
    if (!cleanupRef.current && isMountedRef.current) setAdminLoadProgress(50);
    
    // Load admin modules with minimal delay
    loader.innerHTML = '🔐 Initializing dashboard...';
    await new Promise(resolve => setTimeout(resolve, BROWSER_INFO.mobile ? 200 : 100));
    
    if (!cleanupRef.current && isMountedRef.current) setAdminLoadProgress(75);
    
    // Navigate to admin dashboard
    if (!cleanupRef.current && isMountedRef.current) {
      setAdminLoadProgress(90);
      cleanupRef.current = true; // Prevent further state updates
      loader.innerHTML = '✅ Access granted!';
      
      // Brief success display before navigation
      await new Promise(resolve => setTimeout(resolve, 300));
      navigate('/admin');
    }
    
    // Complete loading
    if (!cleanupRef.current && isMountedRef.current) setAdminLoadProgress(100);
    
    // Calculate and log performance metrics
    const endTime = performance.now();
    const loadDuration = endTime - startTime;
    
    console.log('📊 Optimized Admin Load Performance:', {
      duration: Math.round(loadDuration),
      browser: BROWSER_INFO.name,
      mobile: BROWSER_INFO.mobile,
      timeout: timeoutDuration,
      optimized: true
    });
    
    // Track successful admin load
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'admin_load_success_optimized', {
        load_duration: Math.round(loadDuration),
        browser_name: BROWSER_INFO.name || 'unknown',
        is_mobile: BROWSER_INFO.mobile || false
      });
    }
    
  } catch (error) {
    if (cleanupRef.current || !isMountedRef.current) return; // Don't process errors after cleanup
    
    console.error('Optimized admin access error:', error);
    
    // Enhanced error categorization
    let errorCategory = 'unknown';
    let userFriendlyMessage = 'Failed to access admin dashboard';
    
    if (error.message.includes('fetch')) {
      errorCategory = 'network';
      userFriendlyMessage = 'Network connection issue. Please check your internet and try again.';
    } else if (error.message.includes('localStorage') || error.message.includes('cookies')) {
      errorCategory = 'storage';
      userFriendlyMessage = 'Browser storage issue. Please enable cookies and refresh the page.';
    } else if (error.message.includes('Browser does not support')) {
      errorCategory = 'compatibility';
      userFriendlyMessage = error.message;
    } else if (error.name === 'TimeoutError') {
      errorCategory = 'timeout';
      userFriendlyMessage = 'Request timed out. The server may be busy. Please try again.';
    }
    
    if (isMountedRef.current) {
      setAdminError(userFriendlyMessage);
    }
    
    loader.innerHTML = `❌ ${userFriendlyMessage} <button onclick="window.location.reload()">Retry</button>`;
    
    // Track admin load errors
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'admin_load_error_optimized', {
        error_category: errorCategory,
        error_message: error.message,
        browser_name: BROWSER_INFO.name || 'unknown',
        is_mobile: BROWSER_INFO.mobile || false,
        retry_count: retryCount
      });
    }
    
  } finally {
    // Cleanup resources
    clearTimeout(timeoutId);
    
    // Remove loader after delay
    setTimeout(() => {
      if (loader && loader.parentNode) {
        loader.remove();
      }
      
      if (!cleanupRef.current && isMountedRef.current) {
        setIsAdminLoading(false);
        setAdminLoadProgress(0);
      }
      document.body.classList.remove('admin-accessing');
      document.body.classList.remove('content-layer');
      document.body.removeAttribute('aria-busy');
      document.body.removeAttribute('aria-live');
      document.body.removeAttribute('data-admin-timeouts-cleared');
    }, 800);
  }
}, [isAdminLoading, navigate, retryCount, clearAllAdminTimeouts, verifyAdminDirect]); // Updated dependencies

// Force exit handler for emergency situations
// Force exit handler for emergency situations
  const handleForceExit = useCallback(() => {
    console.warn('🚨 Force exit triggered - Emergency admin access cleanup');
    
    // Set cleanup flag to prevent further operations
    cleanupRef.current = true;
    
    // Track emergency exits
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'admin_force_exit', {
        browser_name: BROWSER_INFO.name || 'unknown',
        error_state: adminError || 'timeout',
        timestamp: Date.now()
      });
    }
    
    // Emergency cleanup
    if (isMountedRef.current) {
      setIsAdminLoading(false);
      setAdminLoadProgress(0);
      setAdminError(null);
      setShowForceExit(false);
      setRetryCount(0);
    }
    
    // Force remove all admin-related classes and overlays
    document.body.classList.remove('admin-accessing', 'content-layer');
    document.body.classList.add('admin-emergency-exit');
    document.body.removeAttribute('aria-busy');
    document.body.removeAttribute('aria-live');
    
    // Remove emergency class after cleanup
    setTimeout(() => {
      document.body.classList.remove('admin-emergency-exit');
      cleanupRef.current = false; // Reset for next attempt
    }, 1000);
    
    // Navigate to safe route
    navigate('/');
  }, [navigate, adminError]); // Removed browserInfo from dependencies

  return (
<div className="min-h-screen bg-background content-layer">
      {/* Admin Loading Progress Bar */}
{isAdminLoading && (
        <>
          <div className="admin-progress-bar" role="progressbar" aria-valuenow={adminLoadProgress} aria-valuemin="0" aria-valuemax="100">
            <div 
              className="admin-progress-fill" 
              style={{ width: `${adminLoadProgress}%` }}
            />
</div>
          
          {/* Non-blocking admin loading indicator */}
          {adminLoadProgress > 0 && adminLoadProgress < 100 && (
            <div className="admin-mini-loader">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
                <span className="text-sm text-gray-700">
                  {adminLoadProgress < 20 ? 'Loading...' : 
                   adminLoadProgress < 60 ? 'Preparing...' :
                   adminLoadProgress < 100 ? 'Almost ready...' : 'Complete!'}
                </span>
              </div>
            </div>
          )}
          
          {/* Error notification without blocking overlay */}
          {adminError && (
            <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50 max-w-sm">
              <div className="flex items-start space-x-2">
                <ApperIcon name="AlertTriangle" className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-800 text-sm font-medium">{adminError}</p>
                  {retryCount > 0 && (
                    <p className="text-red-600 text-xs mt-1">
                      Retry {retryCount}/3
                    </p>
                  )}
                  {showForceExit && (
                    <button
                      onClick={handleForceExit}
                      className="mt-2 text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded transition-colors"
                    >
                      <ApperIcon name="X" className="w-3 h-3 inline mr-1" />
                      Dismiss
                    </button>
                  )}
                </div>
</div>
            </div>
          )}
        </>
      )}
      <Header />
        
<main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/category" element={<Category />} />
            <Route path="/deals" element={<Category />} />
            
            {/* Admin Dashboard Routes */}
<Route path="/admin" element={
              <div className="admin-dashboard fade-in-admin">
                <AdminDashboard />
              </div>
            }>
              <Route index element={<ManageProducts />} />
              <Route path="products" element={<ManageProducts />} />
              <Route path="products/manage" element={<ManageProducts />} />
              <Route path="products/add" element={<AddProduct />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="customers" element={<div className="p-6">Customer Management - Coming Soon</div>} />
              <Route path="users" element={<UserManagement />} />
              <Route path="marketing" element={<div className="p-6">Marketing Tools - Coming Soon</div>} />
              <Route path="reports" element={<ReportsAnalytics />} />
              <Route path="settings" element={<div className="p-6">System Settings - Coming Soon</div>} />
            </Route>
            
            {/* Legacy admin routes for backward compatibility */}
            <Route path="/admin/add-product" element={<AddProduct />} />
            <Route path="/admin/recipe-bundles" element={<RecipeBundlesPage />} />
            <Route path="/admin/add-recipe-bundle" element={<AddRecipeBundle />} />
            
            {/* Extended Admin Routes */}
            <Route path="/admin/users" element={
              <div className="min-h-screen bg-gray-50">
                <Header />
                <main className="container mx-auto px-4 py-8">
                  <UserManagement />
                </main>
              </div>
            } />
            <Route path="/admin/orders-management" element={
              <div className="min-h-screen bg-gray-50">
                <Header />
                <main className="container mx-auto px-4 py-8">
                  <OrderManagement />
                </main>
              </div>
            } />
            <Route path="/admin/analytics" element={
              <div className="min-h-screen bg-gray-50">
                <Header />
                <main className="container mx-auto px-4 py-8">
                  <ReportsAnalytics />
                </main>
              </div>
            } />
          </Routes>
        </main>

        <CartDrawer 
          isOpen={isCartDrawerOpen} 
          onClose={() => setIsCartDrawerOpen(false)} 
        />
<ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        
        {/* Emergency Mask Removal UI */}
        {emergencyCleanup && (
          <div className="mask-emergency">
            <button 
              onClick={performEmergencyCleanup}
              className="emergency-remove-btn"
              title="Force remove blocking overlays"
            >
              ✖ Force Remove Mask
            </button>
          </div>
        )}
        
        {/* Admin Access Portal - Footer Entry Point */}
        <footer className="bg-gray-900 text-white py-8 mt-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="font-display font-bold text-lg mb-4">BazaarPK</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Your trusted online marketplace for fresh, organic, and quality products across Pakistan.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
              
<div>
                <h4 className="font-medium mb-4">System</h4>
                <div className="space-y-2">
                  <a
                    href="/admin-dashboard"
                    className="admin-access-link"
                    data-role="admin-entry"
                    aria-label="Access admin dashboard"
onClick={(e) => {
                      e.preventDefault();
                      handleAdminAccess();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleAdminAccess();
                      }
                    }}
                    aria-label="Access Admin Dashboard"
                    tabIndex={0}
                  >
                    <button
                      disabled={isAdminLoading}
                      className="text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50 flex items-center space-x-1"
                      title="Administrator Access"
                    >
                      {isAdminLoading && (
                        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                      )}
                      <span>Admin Access</span>
                    </button>
                  </a>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-6 pt-6 text-center">
              <p className="text-gray-400 text-sm">
                &copy; 2024 BazaarPK. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
  );
}

function MainApp() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default MainApp;