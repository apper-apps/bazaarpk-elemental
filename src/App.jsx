import '@/index.css';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import Header from "@/components/organisms/Header";
import CartDrawer from "@/components/organisms/CartDrawer";
import Error from "@/components/ui/Error";
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
  if (isAdminLoading) return;
  
  console.log('🔐 Admin access requested - Direct navigation');
  
  try {
    // Set loading state briefly
    setIsAdminLoading(true);
    setAdminError(null);
    
    // Set admin credentials for demo
    localStorage.setItem('userRole', 'admin');
    localStorage.setItem('adminToken', 'demo-admin-' + Date.now());
    localStorage.setItem('adminAuth', 'verified');
    
    // Remove any existing overlays or masks immediately
    const overlays = document.querySelectorAll('.overlay, .mask, .backdrop, .modal-backdrop, [class*="overlay"], [class*="mask"]');
    overlays.forEach(overlay => {
      overlay.remove();
    });
    
    // Ensure body has no blocking classes
    document.body.classList.remove('admin-accessing', 'content-layer', 'modal-open', 'overflow-hidden');
    document.body.removeAttribute('aria-busy');
    document.body.removeAttribute('aria-live');
    
    // Navigate immediately without delays
    navigate('/admin');
    
  } catch (error) {
    console.error('Admin access error:', error);
    setAdminError('Failed to access admin dashboard. Please try again.');
  } finally {
    // Reset loading state immediately
    setIsAdminLoading(false);
  }
}, [isAdminLoading, navigate]);
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
    
    // Emergency cleanup - reset all state immediately
    if (isMountedRef.current) {
      setIsAdminLoading(false);
      setAdminLoadProgress(0);
      setAdminError(null);
      setShowForceExit(false);
      setRetryCount(0);
    }
    
    // Aggressive cleanup of all potential blocking elements
    const allOverlays = document.querySelectorAll(`
      .overlay, .mask, .backdrop, .modal-backdrop, .loading-overlay,
      [class*="overlay"], [class*="mask"], [class*="backdrop"],
      .admin-mini-loader, .admin-loading-spinner
    `);
    allOverlays.forEach(element => {
      element.remove();
    });
    
    // Remove all problematic body classes
    const classesToRemove = [
      'admin-accessing', 'content-layer', 'modal-open', 'overflow-hidden',
      'admin-emergency-exit', 'admin-route'
    ];
    classesToRemove.forEach(className => {
      document.body.classList.remove(className);
    });
    
    // Clear all body attributes that might cause issues
    document.body.removeAttribute('aria-busy');
    document.body.removeAttribute('aria-live');
    document.body.removeAttribute('data-admin-loading');
    
    // Reset body styles
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';
    
    // Reset cleanup flag after immediate cleanup
    cleanupRef.current = false;
    
    // Navigate to safe route
    navigate('/');
}, [navigate, adminError]);

  // Admin verification function
  const verifyAdminAccess = useCallback(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    const forceAdmin = localStorage.getItem('forceAdmin');
    return adminAuth === 'verified' || forceAdmin === 'true';
  }, []);

  // Protected Route component for admin access
  const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    
    useEffect(() => {
      if (!verifyAdminAccess()) {
        navigate('/admin-login');
      }
    }, [location.pathname]);

    if (!verifyAdminAccess()) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <ApperIcon name="Shield" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Admin Access Required</h2>
            <p className="text-gray-600 mb-4">You need administrator privileges to access this area.</p>
            <button
              onClick={handleAdminAccess}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Request Admin Access
            </button>
          </div>
        </div>
      );
    }
    
    return children;
  };

  const location = useLocation();
  
  return (
    <div className="app-container">
      <div className="min-h-screen bg-background">
{isAdminLoading && (
          <div className="admin-progress-bar" role="progressbar" aria-valuenow={adminLoadProgress} aria-valuemin="0" aria-valuemax="100">
            <div 
              className="admin-progress-fill" 
              style={{ width: `${adminLoadProgress}%` }}
            />
          </div>
        )}
          
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
            
            {/* Add admin-dashboard route for direct access */}
            <Route path="/admin-dashboard" element={<div className="admin-dashboard fade-in-admin">
                <AdminDashboard />
              </div>} />
            
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
            {/* Admin Login Route */}
            <Route path="/admin-login" element={
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
                  <div className="text-center mb-6">
                    <ApperIcon name="ShieldCheck" className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Login</h1>
                    <p className="text-gray-600">Access the administrative dashboard</p>
                  </div>
                  
                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        localStorage.setItem('adminAuth', 'verified');
                        navigate('/admin');
                      }}
                      className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                    >
                      Access Admin Dashboard
                    </button>
                    
                    <button
                      onClick={() => {
                        localStorage.setItem('forceAdmin', 'true');
                        navigate('/admin');
                      }}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
                    >
                      Force Admin Access
                    </button>
                    
                    <button
                      onClick={() => navigate('/')}
                      className="w-full text-gray-600 hover:text-gray-800 py-2 transition-colors"
                    >
                      Back to Home
                    </button>
                  </div>
                </div>
              </div>
            } />
            
            {/* Wrap Admin Routes with Protection */}
            <Route path="/admin/*" element={
              <ProtectedRoute>
                <Routes>
                  <Route path="/" element={<div className="admin-dashboard fade-in-admin">
                        <AdminDashboard />
                      </div>}>
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
                </Routes>
              </ProtectedRoute>
            } />
          </Routes>
        </main>

        <CartDrawer 
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
                  <button
                    onClick={handleAdminAccess}
                    disabled={isAdminLoading}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
                    title="Administrator Access"
                    aria-label="Access Admin Dashboard"
                  >
                    {isAdminLoading && (
                      <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>Admin Access</span>
                  </button>
                  
                  {/* Emergency Admin Access Button */}
                  <div className="admin-fallback mt-3 pt-3 border-t border-gray-700">
                    <button
                      onClick={() => {
                        localStorage.setItem('forceAdmin', 'true');
                        window.location.reload();
                      }}
                      className="text-xs text-orange-400 hover:text-orange-300 transition-colors flex items-center space-x-1 cursor-pointer"
                      title="Force Admin Dashboard Load"
                      aria-label="Emergency Admin Access"
                    >
                      <ApperIcon name="Shield" size={12} />
                      <span>Force Admin Load</span>
                    </button>
                  </div>
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