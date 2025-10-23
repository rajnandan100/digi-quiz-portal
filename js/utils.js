// Utils.js - Enhanced Helper Functions
// Version 2.0 with additional utilities for quiz portal

// =========================================================
// DATE & TIME UTILITIES
// =========================================================

// Format a date string to "Day Month Year" format
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

// Format date to short format
function formatDateShort(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: '2-digit',
        month: 'short',
        day: 'numeric',
    });
}

// Format seconds to MM:SS format
function formatTimeFromSeconds(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Convert time string (MM:SS) to seconds
function timeToSeconds(timeString) {
    if (!timeString || timeString === 'N/A') return 0;
    const parts = timeString.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

// Get relative time (e.g., "2 hours ago")
function getRelativeTime(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
}

// =========================================================
// VALIDATION UTILITIES
// =========================================================

// Validate email format using regex
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate name (only letters and spaces)
function isValidName(name) {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name.trim());
}

// Validate quiz data structure
function isValidQuizData(quiz) {
    if (!quiz || typeof quiz !== 'object') return false;
    if (!quiz.subject || !quiz.date || !quiz.questions) return false;
    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) return false;
    
    return quiz.questions.every(q => 
        q.question &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correctAnswer === 'number' &&
        q.correctAnswer >= 0 &&
        q.correctAnswer <= 3 &&
        q.explanation
    );
}

// =========================================================
// SECURITY UTILITIES
// =========================================================

// Sanitize a string to prevent HTML injection
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Escape HTML characters
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// =========================================================
// ID & UNIQUE VALUE GENERATORS
// =========================================================

// Generate a unique ID for sessions or objects
function generateUniqueId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Generate quiz ID
function generateQuizId() {
    return 'quiz_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

// Generate session ID
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
}

// =========================================================
// NOTIFICATION SYSTEM
// =========================================================

// Show toast notification message
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${getToastIcon(type)} me-2"></i>
        ${message}
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 15px 20px;
        background: ${getToastColor(type)};
        color: white;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 9999;
        animation: slideInRight 0.3s ease-out;
        max-width: 350px;
        min-width: 250px;
        display: flex;
        align-items: center;
        gap: 10px;
    `;

    // Add close button styles
    const style = document.createElement('style');
    style.textContent = `
        .toast-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            opacity: 0.7;
            margin-left: auto;
        }
        .toast-close:hover {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }
    }, duration);

    return toast;
}

// Get appropriate icon for toast type
function getToastIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'times-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle',
    };
    return icons[type] || 'info-circle';
}

// Get appropriate color for toast type
function getToastColor(type) {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
    };
    return colors[type] || '#3b82f6';
}

// =========================================================
// LOCAL STORAGE UTILITIES
// =========================================================

// Safe localStorage operations with error handling
const Storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    },

    exists(key) {
        return localStorage.getItem(key) !== null;
    }
};

// =========================================================
// ARRAY & OBJECT UTILITIES
// =========================================================

// Shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Deep clone object
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Remove duplicates from array based on property
function removeDuplicates(array, property) {
    const seen = new Map();
    return array.filter(item => {
        const key = property ? item[property] : item;
        if (seen.has(key)) return false;
        seen.set(key, true);
        return true;
    });
}

// Sort array of objects by property
function sortBy(array, property, ascending = true) {
    return [...array].sort((a, b) => {
        const aVal = a[property];
        const bVal = b[property];
        if (ascending) {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
    });
}

// =========================================================
// PERFORMANCE & DEBOUNCING
// =========================================================

// Debounce function to limit function calls
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

// Throttle function to limit function calls
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// =========================================================
// PARTICLES.JS INITIALIZATION
// =========================================================

// Initialize particles.js animation if available
function initParticles() {
    if (typeof particlesJS !== 'undefined' && document.getElementById('particles-js')) {
        particlesJS('particles-js', {
            particles: {
                number: { 
                    value: 80, 
                    density: { enable: true, value_area: 800 } 
                },
                color: { value: '#ffffff' },
                shape: { type: 'circle' },
                opacity: { 
                    value: 0.5, 
                    random: false,
                    anim: { enable: true, speed: 1, opacity_min: 0.1 }
                },
                size: { 
                    value: 3, 
                    random: true,
                    anim: { enable: true, speed: 2, size_min: 0.1 }
                },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: '#ffffff',
                    opacity: 0.4,
                    width: 1,
                },
                move: {
                    enable: true,
                    speed: 2,
                    direction: 'none',
                    random: false,
                    straight: false,
                    out_mode: 'out',
                    bounce: false,
                    attract: { enable: false, rotateX: 600, rotateY: 1200 }
                },
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: { enable: true, mode: 'repulse' },
                    onclick: { enable: true, mode: 'push' },
                    resize: true,
                },
                modes: {
                    grab: { distance: 400, line_linked: { opacity: 1 } },
                    bubble: { distance: 400, size: 40, duration: 2, opacity: 8, speed: 3 },
                    repulse: { distance: 200, duration: 0.4 },
                    push: { particles_nb: 4 },
                    remove: { particles_nb: 2 }
                }
            },
            retina_detect: true,
        });
        console.log('✅ Particles.js initialized');
    }
}

// =========================================================
// QUIZ SPECIFIC UTILITIES
// =========================================================

// Calculate quiz statistics
function calculateQuizStats(attempts) {
    if (!attempts || attempts.length === 0) {
        return {
            totalAttempts: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0,
            averageTime: 0
        };
    }

    const scores = attempts.map(a => a.accuracy || 0);
    const times = attempts.map(a => timeToSeconds(a.time)).filter(t => t > 0);

    return {
        totalAttempts: attempts.length,
        averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
        averageTime: times.length > 0 ? formatTimeFromSeconds(Math.floor(times.reduce((a, b) => a + b, 0) / times.length)) : '00:00'
    };
}

// Generate leaderboard from attempts
function generateLeaderboard(attempts, limit = 10) {
    if (!attempts || attempts.length === 0) return [];

    return attempts
        .sort((a, b) => {
            if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
            return timeToSeconds(a.time) - timeToSeconds(b.time);
        })
        .slice(0, limit)
        .map((attempt, index) => ({
            rank: index + 1,
            ...attempt
        }));
}

// =========================================================
// DOM UTILITIES
// =========================================================

// Wait for DOM to be ready
function domReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
}

// Smooth scroll to element
function scrollToElement(element, offset = 0) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) {
        const top = el.offsetTop - offset;
        window.scrollTo({
            top: top,
            behavior: 'smooth'
        });
    }
}

// =========================================================
// INITIALIZATION
// =========================================================

// Initialize utilities when DOM is ready
domReady(() => {
    console.log('🛠️ Utils.js loaded and ready');
    
    // Initialize particles if element exists
    if (document.getElementById('particles-js')) {
        // Wait a bit for particles.js to load
        setTimeout(initParticles, 500);
    }
    
    // Add CSS animations for toast notifications
    if (!document.getElementById('utils-styles')) {
        const style = document.createElement('style');
        style.id = 'utils-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
});

// Export utilities to global scope for backward compatibility
window.formatDate = formatDate;
window.formatTimeFromSeconds = formatTimeFromSeconds;
window.isValidEmail = isValidEmail;
window.sanitizeInput = sanitizeInput;
window.generateUniqueId = generateUniqueId;
window.showToast = showToast;
window.initParticles = initParticles;
window.Storage = Storage;

console.log('✅ utils.js loaded - Enhanced Version 2.0 with complete functionality');
