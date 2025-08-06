// Timeout management module for safe async operations
const TIMEOUT_LIMIT = 8000; // 8 seconds

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
  // Remove mask elements
  document.querySelectorAll('.mask, .overlay, .backdrop, .modal-backdrop').forEach(element => {
    element.remove();
  });
  
  // Add emergency cleanup class to body
  document.body.classList.add('admin-emergency-exit');
  
  // Clear all admin timeouts
  clearAllTimeouts();
  
  // Set cleanup flag
  document.body.setAttribute('data-admin-timeouts-cleared', 'true');
  
  console.warn('Emergency cleanup performed - removed blocking overlays');
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
    <button onclick="window.performEmergencyCleanup?.()">
      ✖ Force Remove Mask
    </button>
  `;
  
  document.body.appendChild(button);
  
  // Make cleanup function globally available
  window.performEmergencyCleanup = performEmergencyCleanup;
}

export { TIMEOUT_LIMIT };