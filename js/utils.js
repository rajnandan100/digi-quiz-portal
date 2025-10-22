// Utility functions for the quiz application

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format date
function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

// Format time from seconds
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Get session data
function getSession() {
  return JSON.parse(localStorage.getItem('userSession') || '{}');
}

// Set session data
function setSession(data) {
  localStorage.setItem('userSession', JSON.stringify(data));
}

// Clear session
function clearSession() {
  localStorage.removeItem('userSession');
  window.location.href = 'index.html';
}

// Show toast notification
function showToast(message, type = 'info') {
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      icon: type,
      title: message
    });
  } else {
    alert(message);
  }
}

// Validate email
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

console.log('✅ Utils.js loaded successfully');