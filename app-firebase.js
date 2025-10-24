// Firebase-Integrated App Logic for Daily Quiz Portal
// Preserving Original Design & Functionality + Firebase
// ===================================================

import { onAuthStateChange, signInWithGoogle, signOutUser, getCurrentUser } from './firebase-auth.js';
import { getAvailableQuizzes, getDashboardStats, listenToQuizzes } from './firebase-quiz.js';

// Main application logic (preserving your original class structure)
class QuizAppFirebase {
    constructor() {
        this.currentUser = null;
        this.currentQuiz = null;
        this.userAnswers = [];
        this.startTime = null;
        this.endTime = null;
        this.quizzesListener = null;
        console.log('🚀 Firebase Quiz App initialized');
    }

    // Initialize the application (your original init method)
    async init() {
        try {
            console.log('🔧 Initializing Firebase Quiz App...');
            
            // Show loading state
            this.showAuthLoading(true);
            
            // Setup Firebase auth listener
            this.setupAuthStateListener();
            
            // Setup event listeners (your original)
            this.setupEventListeners();
            
            // Populate date selector (your original)
            this.populateDateSelector();
            
            // Load dashboard stats
            await this.loadDashboardStats();
            
            console.log('✅ Firebase Quiz App ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showError('Failed to initialize application');
        }
    }

    // Setup Firebase authentication state listener
    setupAuthStateListener() {
        onAuthStateChange((user) => {
            this.currentUser = user;
            
            if (user) {
                console.log('👤 User signed in:', user.displayName);
                this.showAuthenticatedState(user);
                this.loadAvailableQuizzes();
                this.setupSubjectCards();
            } else {
                console.log('👤 User signed out');
                this.showUnauthenticatedState();
            }
            
            this.showAuthLoading(false);
        });
    }

    // Setup event listeners (preserving your original structure)
    setupEventListeners() {
        // Google Sign-In Button
        const googleSignInBtn = document.getElementById('googleSignInBtn');
        if (googleSignInBtn) {
            googleSignInBtn.addEventListener('click', () => this.handleGoogleSignIn());
        }

        // Sign Out Button
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => this.handleSignOut());
        }

        // Continue to Quizzes Button
        const continueBtn = document.getElementById('continueToQuizzes');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => this.scrollToQuizzes());
        }

        // Pre-quiz form submission (your original)
        const preQuizForm = document.getElementById('preQuizForm');
        if (preQuizForm) {
            preQuizForm.addEventListener('submit', (e) => this.handlePreQuizSubmit(e));
        }

        // Quiz date change (your original)
        const quizDateSelect = document.getElementById('quizDate');
        if (quizDateSelect) {
            quizDateSelect.addEventListener('change', () => this.loadAvailableQuizzes());
        }

        // Filter controls (your original)
        const filterSubject = document.getElementById('filterSubject');
        if (filterSubject) {
            filterSubject.addEventListener('change', () => this.loadAvailableQuizzes());
        }
    }

    // Handle Google Sign-In
    async handleGoogleSignIn() {
        try {
            this.showAuthLoading(true);
            const user = await signInWithGoogle();
            console.log('✅ Sign-in successful:', user.name);
            
            // Show success message
            this.showToast('Welcome! Signed in successfully', 'success');
            
        } catch (error) {
            console.error('❌ Sign-in failed:', error);
            this.showError(error.message || 'Sign-in failed');
            this.showAuthLoading(false);
        }
    }

    // Handle Sign Out
    async handleSignOut() {
        try {
            await signOutUser();
            this.showToast('Signed out successfully', 'info');
            
            // Clean up listeners
            if (this.quizzesListener) {
                this.quizzesListener();
                this.quizzesListener = null;
            }
            
        } catch (error) {
            console.error('❌ Sign-out failed:', error);
            this.showError('Sign-out failed');
        }
    }

    // Show authenticated state
    showAuthenticatedState(user) {
        const beforeLogin = document.getElementById('beforeLogin');
        const afterLogin = document.getElementById('afterLogin');
        const quizSection = document.getElementById('quizSection');
        
        if (beforeLogin) beforeLogin.style.display = 'none';
        if (afterLogin) {
            afterLogin.style.display = 'block';
            
            // Populate user info
            const userPhoto = document.getElementById('userPhoto');
            const userName = document.getElementById('userName');
            const userEmail = document.getElementById('userEmail');
            
            if (userPhoto) userPhoto.src = user.photoURL || 'https://via.placeholder.com/60';
            if (userName) userName.textContent = user.displayName || 'User';
            if (userEmail) userEmail.textContent = user.email || '';
        }
        if (quizSection) quizSection.style.display = 'block';

        // Update pre-quiz form
        const studentName = document.getElementById('studentName');
        const studentEmail = document.getElementById('studentEmail');
        if (studentName) studentName.value = user.displayName || '';
        if (studentEmail) studentEmail.value = user.email || '';
    }

    // Show unauthenticated state
    showUnauthenticatedState() {
        const beforeLogin = document.getElementById('beforeLogin');
        const afterLogin = document.getElementById('afterLogin');
        const quizSection = document.getElementById('quizSection');
        
        if (beforeLogin) beforeLogin.style.display = 'block';
        if (afterLogin) afterLogin.style.display = 'none';
        if (quizSection) quizSection.style.display = 'none';
    }

    // Show/hide auth loading
    showAuthLoading(show) {
        const authLoading = document.getElementById('authLoading');
        const beforeLogin = document.getElementById('beforeLogin');
        const afterLogin = document.getElementById('afterLogin');
        
        if (authLoading) {
            authLoading.style.display = show ? 'block' : 'none';
        }
        
        if (!show) {
            // Show appropriate section based on auth state
            if (this.currentUser) {
                if (beforeLogin) beforeLogin.style.display = 'none';
                if (afterLogin) afterLogin.style.display = 'block';
            } else {
                if (beforeLogin) beforeLogin.style.display = 'block';
                if (afterLogin) afterLogin.style.display = 'none';
            }
        } else {
            if (beforeLogin) beforeLogin.style.display = 'none';
            if (afterLogin) afterLogin.style.display = 'none';
        }
    }

    // Scroll to quizzes section
    scrollToQuizzes() {
        const quizSection = document.getElementById('quizSection');
        if (quizSection) {
            quizSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Populate date selector (your original method)
    populateDateSelector() {
        const dateSelect = document.getElementById('quizDate');
        if (!dateSelect) return;

        // Clear existing options except the first one
        while (dateSelect.children.length > 1) {
            dateSelect.removeChild(dateSelect.lastChild);
        }

        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            const displayStr = i === 0 ? 'Today' : 
                              i === 1 ? 'Tomorrow' : 
                              date.toLocaleDateString('en-IN', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric' 
                              });

            const option = document.createElement('option');
            option.value = dateStr;
            option.textContent = displayStr;
            if (i === 0) option.selected = true;
            dateSelect.appendChild(option);
        }
    }

    // Setup subject cards (your original design)
    setupSubjectCards() {
        const subjectCards = document.getElementById('subjectCards');
        if (!subjectCards) return;

        const subjects = [
            { name: 'Mathematics', icon: 'fas fa-calculator', color: '#6366f1' },
            { name: 'Science', icon: 'fas fa-flask', color: '#10b981' },
            { name: 'English', icon: 'fas fa-book-open', color: '#f59e0b' },
            { name: 'History', icon: 'fas fa-landmark', color: '#ef4444' },
            { name: 'Geography', icon: 'fas fa-globe-americas', color: '#8b5cf6' },
            { name: 'Computer Science', icon: 'fas fa-laptop-code', color: '#06b6d4' }
        ];

        subjectCards.innerHTML = subjects.map(subject => `
            <div class="modern-subject-card" data-subject="${subject.name}">
                <div class="subject-icon">
                    <i class="${subject.icon}"></i>
                </div>
                <h6 class="mt-3 mb-0">${subject.name}</h6>
                <div class="checkmark">
                    <i class="fas fa-check"></i>
                </div>
            </div>
        `).join('');

        // Add click handlers for subject cards
        document.querySelectorAll('.modern-subject-card').forEach(card => {
            card.addEventListener('click', (e) => this.selectSubject(e));
        });
    }

    // Subject selection (your original method)
    selectSubject(e) {
        const card = e.currentTarget;
        const subject = card.dataset.subject;
        
        // Remove previous selection
        document.querySelectorAll('.modern-subject-card').forEach(c => {
            c.classList.remove('selected');
        });
        
        // Add selection to clicked card
        card.classList.add('selected');
        
        // Update filter and reload quizzes
        const filterSubject = document.getElementById('filterSubject');
        if (filterSubject) {
            filterSubject.value = subject;
        }
        
        this.loadAvailableQuizzes();
        
        // Smooth scroll to quiz cards
        setTimeout(() => {
            const quizCards = document.getElementById('quizCards');
            if (quizCards) {
                quizCards.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }

    // Load available quizzes with Firebase
    async loadAvailableQuizzes() {
        if (!this.currentUser) return;
        
        try {
            const selectedDate = document.getElementById('quizDate')?.value;
            const selectedSubject = document.getElementById('filterSubject')?.value;
            
            const filters = {};
            if (selectedDate) filters.date = selectedDate;
            if (selectedSubject) filters.subject = selectedSubject;
            
            const quizzes = await getAvailableQuizzes(filters);
            this.displayQuizzes(quizzes);
            this.updateQuizCount(quizzes.length);
            
        } catch (error) {
            console.error('Error loading quizzes:', error);
            this.showError('Failed to load quizzes');
        }
    }

    // Display quizzes (your original design)
    displayQuizzes(quizzes) {
        const container = document.getElementById('quizCards');
        if (!container) return;

        if (quizzes.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-inbox fa-4x text-muted mb-3"></i>
                    <h4 class="text-muted">No quizzes available</h4>
                    <p class="text-muted">Check back later or select a different date/subject.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = quizzes.map(quiz => `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card quiz-card hover-lift h-100">
                    <div class="card-header bg-primary text-white">
                        <h6 class="mb-0">
                            <i class="fas fa-calendar me-2"></i>
                            ${this.formatDate(quiz.date)}
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h5 class="card-title mb-0">${quiz.subject}</h5>
                            <span class="badge bg-info">${quiz.totalQuestions} Qs</span>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between text-muted small mb-1">
                                <span><i class="fas fa-clock me-1"></i>Duration</span>
                                <span>${Math.round(quiz.timeLimit / 60)} minutes</span>
                            </div>
                            <div class="d-flex justify-content-between text-muted small mb-1">
                                <span><i class="fas fa-users me-1"></i>Attempts</span>
                                <span>${quiz.attempts || 0}</span>
                            </div>
                            <div class="d-flex justify-content-between text-muted small">
                                <span><i class="fas fa-star me-1"></i>Difficulty</span>
                                <span>${quiz.difficulty || 'Medium'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent">
                        <button class="btn btn-primary w-100" onclick="app.startQuiz('${quiz.id}')">
                            <i class="fas fa-play me-2"></i>Start Quiz
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Update quiz count (your original method)
    updateQuizCount(count) {
        const countElement = document.getElementById('quizCount');
        if (countElement) {
            countElement.textContent = count;
        }
    }

    // Load dashboard statistics
    async loadDashboardStats() {
        try {
            const stats = await getDashboardStats();
            
            const totalUsers = document.getElementById('totalUsers');
            const totalQuizzes = document.getElementById('totalQuizzes');
            const totalAttempts = document.getElementById('totalAttempts');
            
            if (totalUsers) this.animateCounter(totalUsers, stats.totalUsers || 0);
            if (totalQuizzes) this.animateCounter(totalQuizzes, stats.totalQuizzes || 0);
            if (totalAttempts) this.animateCounter(totalAttempts, stats.totalAttempts || 0);
            
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    // Animate counter (your original effect)
    animateCounter(element, target) {
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 20);
    }

    // Start quiz (your original method + Firebase)
    async startQuiz(quizId) {
        try {
            const quiz = await getQuizById(quizId);
            this.currentQuiz = quiz;
            
            // Populate quiz details in modal
            this.populateQuizModal(quiz);
            
            // Show pre-quiz modal
            const modal = new bootstrap.Modal(document.getElementById('preQuizModal'));
            modal.show();
            
        } catch (error) {
            console.error('Error starting quiz:', error);
            this.showError('Failed to load quiz');
        }
    }

    // Populate quiz modal (your original design)
    populateQuizModal(quiz) {
        const quizDetails = document.getElementById('quizDetails');
        if (quizDetails) {
            quizDetails.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${quiz.subject}</h5>
                        <div class="row">
                            <div class="col-6">
                                <p class="mb-2"><strong>Questions:</strong> ${quiz.totalQuestions}</p>
                                <p class="mb-2"><strong>Duration:</strong> ${Math.round(quiz.timeLimit / 60)} minutes</p>
                            </div>
                            <div class="col-6">
                                <p class="mb-2"><strong>Difficulty:</strong> ${quiz.difficulty || 'Medium'}</p>
                                <p class="mb-2"><strong>Date:</strong> ${this.formatDate(quiz.date)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Handle pre-quiz form submit (your original + Firebase)
    handlePreQuizSubmit(e) {
        e.preventDefault();
        
        if (!this.currentQuiz) {
            this.showError('No quiz selected');
            return;
        }
        
        // Store quiz attempt start time
        this.startTime = new Date();
        
        // Redirect to quiz page with Firebase data
        const quizUrl = `quiz.html?id=${this.currentQuiz.id}&user=${this.currentUser.uid}`;
        window.location.href = quizUrl;
    }

    // Utility Methods (your original)
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    showError(message) {
        console.error('Error:', message);
        // You can integrate with your existing toast/alert system
        alert(message); // Temporary - replace with your preferred notification
    }

    showToast(message, type = 'info') {
        console.log(`Toast (${type}):`, message);
        // You can integrate with your existing toast system
    }
}

// Initialize the app
const app = new QuizAppFirebase();

// Make app available globally (for quiz card onclick)
window.app = app;

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Export for other modules if needed
export default app;
