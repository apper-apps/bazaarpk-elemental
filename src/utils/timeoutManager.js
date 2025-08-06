// Timeout management module for safe async operations
const TIMEOUT_LIMIT = 8000; // 8 seconds

// Polyfill for CustomEvent in environments where it's not available
const SafeCustomEvent = typeof CustomEvent !== 'undefined' 
  ? CustomEvent 
  : function(event, params) {
      params = params || { bubbles: false, cancelable: false, detail: null };
      const evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
      return evt;
    };

/**
 * Creates a safe timeout with error handling and cleanup tracking
 * @param {Function} callback - Function to execute after delay
 * @param {number} delay - Delay in milliseconds
 * @returns {number} Timeout ID for cleanup
 */
export function createSafeTimeout(callback, delay) {
  const id = setTimeout(() => {
    try {
      callback();
    } catch (err) {
      console.error('Timeout error:', err);
      // Emergency cleanup as fallback
      performEmergencyCleanup();
    }
  }, delay);
  
  // Track for emergency cleanup
  if (!window.adminTimeoutIds) {
    window.adminTimeoutIds = [];
  }
  window.adminTimeoutIds.push(id);
  
  return id;
}

/**
 * Clear all tracked timeouts
 */
export function clearAllTimeouts() {
  if (window.adminTimeoutIds) {
    window.adminTimeoutIds.forEach(id => clearTimeout(id));
    window.adminTimeoutIds = [];
  }
}

/**
 * Emergency cleanup function to remove blocking overlays
 */
export function performEmergencyCleanup() {
  // Remove mask elements with detailed logging
  const elements = document.querySelectorAll('.mask, .overlay, .backdrop, .modal-backdrop');
  console.log('Emergency cleanup removing', elements.length, 'blocking elements');
  
  elements.forEach((element, index) => {
    console.log(`Removing element ${index + 1}:`, {
      className: element.className,
      id: element.id,
      tagName: element.tagName,
      parentElement: element.parentElement?.tagName
    });
    element.remove();
  });
  
  // Add emergency cleanup class to body
  document.body.classList.add('admin-emergency-exit');
  
  // Clear all admin timeouts
  clearAllTimeouts();
  
  // Set cleanup flag
  document.body.setAttribute('data-admin-timeouts-cleared', 'true');
  
  console.warn('Emergency cleanup performed - removed', elements.length, 'blocking overlays');
console.warn('Emergency cleanup performed - removed', elements.length, 'blocking overlays');
  
  // Dispatch cleanup event for tracking
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(new SafeCustomEvent('emergency_cleanup_performed', {
      detail: {
        type: 'manual_emergency_cleanup',
        elementsRemoved: elements.length,
        timestamp: Date.now()
      }
    }));
  }
}
/**
 * Global cleanup function for mask-related errors
 */
export function performGlobalMaskCleanup(errorContext = 'unknown') {
  const selectors = [
    '.mask', '.overlay', '.backdrop', '.modal-backdrop',
    '[class*="mask"]', '[class*="overlay"]', '[class*="backdrop"]',
    'div[style*="position: fixed"][style*="z-index"]'
  ];
  
  let totalRemoved = 0;
  
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      // Additional check to avoid removing legitimate UI elements
      const isBlockingElement = 
        element.style.position === 'fixed' || 
        element.classList.contains('mask') ||
        element.classList.contains('overlay') ||
        element.classList.contains('backdrop');
        
      if (isBlockingElement) {
        console.log('Global cleanup removing:', {
          selector,
          className: element.className,
          id: element.id,
          context: errorContext
        });
        element.remove();
        totalRemoved++;
      }
    });
  });
  
  if (totalRemoved > 0) {
    console.warn(`Global mask cleanup removed ${totalRemoved} elements (context: ${errorContext})`);
console.warn(`Global mask cleanup removed ${totalRemoved} elements (context: ${errorContext})`);
    
    // Dispatch global cleanup event
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new SafeCustomEvent('global_mask_cleanup', {
        detail: {
          type: 'global_mask_cleanup',
          elementsRemoved: totalRemoved,
          context: errorContext,
          timestamp: Date.now()
        }
      }));
    }
  }
}

/**
 * Show emergency mask removal button
 */
export function showEmergencyButton() {
  const existingButton = document.getElementById('emergency-mask-remove');
  if (existingButton) return;
  
  const button = document.createElement('div');
  button.id = 'emergency-mask-remove';
  button.className = 'mask-emergency';
  button.innerHTML = `
    <button class="emergency-remove-btn" onclick="window.performEmergencyCleanup?.()">
      ✖ Force Remove Mask
    </button>
  `;
  
  document.body.appendChild(button);
  
  // Make cleanup functions globally available
  window.performEmergencyCleanup = performEmergencyCleanup;
  window.performGlobalMaskCleanup = performGlobalMaskCleanup;
  
  console.log('Emergency mask removal button displayed');
}

/**
 * Auto-detect and cleanup stuck masks
 */
export function detectAndCleanupStuckMasks() {
  const potentialMasks = document.querySelectorAll('div[style*="position: fixed"], div[style*="z-index"]');
  let suspiciousMasks = 0;
  
  potentialMasks.forEach(element => {
    const computedStyle = window.getComputedStyle(element);
    const isFullScreen = 
      computedStyle.width === '100vw' || 
      computedStyle.width === '100%' ||
      (element.offsetWidth >= window.innerWidth * 0.9);
    
    const hasHighZIndex = parseInt(computedStyle.zIndex) > 1000;
    const isTransparent = computedStyle.backgroundColor === 'rgba(0, 0, 0, 0)' || 
                         computedStyle.opacity === '0';
    
    if (isFullScreen && hasHighZIndex && !isTransparent) {
      console.log('Detected suspicious mask-like element:', {
        className: element.className,
        id: element.id,
        zIndex: computedStyle.zIndex,
        size: `${element.offsetWidth}x${element.offsetHeight}`
      });
      suspiciousMasks++;
    }
  });
  
  if (suspiciousMasks > 0) {
    console.warn(`Detected ${suspiciousMasks} suspicious mask-like elements`);
    return performGlobalMaskCleanup('auto_detection');
  }
  
  return 0;
}

export { TIMEOUT_LIMIT };