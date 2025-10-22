// Main application logic for the quiz portal

class QuizApp {
  constructor() {
    this.currentQuiz = null;
    this.userAnswers = [];
    this.startTime = null;
    this.endTime = null;
    console.log('🚀 QuizApp initialized');
  }

  // Initialize the application
  init() {
    this.setupEventListeners();
    this.loadAvailableQuizzes();
    this.populateDateSelector();
    console.log('✅ QuizApp ready');
  }

  // Setup event listeners
  setupEventListeners() {
    // Pre-quiz form submission
    const preQuizForm = document.getElementById('preQuizForm');
    if (preQuizForm) {
      preQuizForm.addEventListener('submit', (e) => this.handlePreQuizSubmit(e));
    }

    // Subject selection
    document.querySelectorAll('.subject-card').forEach(card => {
      card.addEventListener('click', (e) => this.selectSubject(e));
    });

    // Quiz date change
    const quizDateSelect = document.getElementById('quizDate');
    if (quizDateSelect) {
      quizDateSelect.addEventListener('change', () => this.loadAvailableQuizzes());
    }

    // Filter controls
    const filterSubject = document.getElementById('filterSubject');
    const filterStatus = document.getElementById('filterStatus');
    
    if (filterSubject) {
      filterSubject.addEventListener('change', () => this.filterQuizzes());
    }
    
    if (filterStatus) {
      filterStatus.addEventListener('change', () => this.filterQuizzes());
    }
  }

  // Populate date selector with next 7 days
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
                        date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
      
      const option = document.createElement('option');
      option.value = dateStr;
      option.textContent = displayStr;
      
      if (i === 0) option.selected = true; // Select today by default
      
      dateSelect.appendChild(option);
    }
  }

  // Load available quizzes
  async loadAvailableQuizzes() {
    try {
      const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
      const selectedDate = document.getElementById('quizDate')?.value;
      const selectedSubject = document.getElementById('selectedSubject')?.value;

      let filteredQuizzes = quizzes;

      // Filter by date if selected
      if (selectedDate) {
        filteredQuizzes = filteredQuizzes.filter(q => q.date === selectedDate);
      }

      // Filter by subject if selected
      if (selectedSubject) {
        filteredQuizzes = filteredQuizzes.filter(q => q.subject === selectedSubject);
      }

      this.displayQuizzes(filteredQuizzes);
      this.updateQuizCount(filteredQuizzes.length);
      
    } catch (error) {
      console.error('Error loading quizzes:', error);
      this.showError('Failed to load quizzes');
    }
  }

  // Display quizzes in cards
  displayQuizzes(quizzes) {
    const container = document.getElementById('quizCards');
    if (!container) return;

    if (quizzes.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="fas fa-inbox fa-5x text-muted mb-3"></i>
          <h4 class="text-muted">No Quizzes Available</h4>
          <p class="text-muted">Check back later or select a different date/subject.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = quizzes.map(quiz => {
      const attempts = this.getUserAttempts(quiz.quizId);
      const bestAttempt = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0;
      const isAttempted = attempts.length > 0;

      return `
        <div class="col-lg-4 col-md-6 mb-4">
          <div class="card quiz-card h-100 hover-lift" onclick="quizApp.startQuiz('${quiz.quizId}')">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <h5 class="card-title fw-bold">
                  <i class="fas fa-book text-primary me-2"></i>
                  ${quiz.subject}
                </h5>
                <span class="badge ${isAttempted ? 'bg-success' : 'bg-warning text-dark'}">
                  ${isAttempted ? 'Attempted' : 'New'}
                </span>
              </div>
              
              <div class="mb-3">
                <small class="text-muted d-block">
                  <i class="fas fa-calendar me-1"></i>
                  ${new Date(quiz.date).toLocaleDateString('en-IN')}
                </small>
                <small class="text-muted d-block">
                  <i class="fas fa-question-circle me-1"></i>
                  ${quiz.totalQuestions} Questions
                </small>
                <small class="text-muted d-block">
                  <i class="fas fa-clock me-1"></i>
                  ${Math.ceil(quiz.timeLimit / 60)} Minutes
                </small>
                ${isAttempted ? `
                  <small class="text-success d-block mt-2">
                    <i class="fas fa-star me-1"></i>
                    Best Score: ${bestAttempt}/${quiz.totalQuestions}
                  </small>
                ` : ''}
              </div>
              
              <button class="btn btn-primary w-100">
                <i class="fas fa-play me-2"></i>
                ${isAttempted ? 'Retake Quiz' : 'Start Quiz'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Get user attempts for a quiz
  getUserAttempts(quizId) {
    const session = JSON.parse(localStorage.getItem('userSession') || '{}');
    if (!session.email) return [];

    const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    return attempts.filter(a => a.email === session.email && a.quizId === quizId);
  }

  // Update quiz count
  updateQuizCount(count) {
    const element = document.getElementById('quizCount');
    if (element) {
      element.textContent = count;
    }
  }

  // Handle pre-quiz form submission
  handlePreQuizSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userData = {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      quizDate: formData.get('quizDate'),
      subject: formData.get('subject')
    };

    // Validate required fields
    if (!userData.fullName || !userData.email || !userData.quizDate || !userData.subject) {
      this.showError('Please fill in all required fields and select a subject');
      return;
    }

    // Validate email
    if (!this.isValidEmail(userData.email)) {
      this.showError('Please enter a valid email address');
      return;
    }

    // Save user session
    localStorage.setItem('userSession', JSON.stringify(userData));
    
    // Find and start the quiz
    this.findAndStartQuiz(userData.quizDate, userData.subject);
  }

  // Find and start quiz based on date and subject
  findAndStartQuiz(date, subject) {
    const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
    const quiz = quizzes.find(q => q.date === date && q.subject === subject);

    if (quiz) {
      this.startQuiz(quiz.quizId);
    } else {
      this.showError('No quiz found for the selected date and subject');
    }
  }

  // Start a quiz
  startQuiz(quizId) {
    const session = JSON.parse(localStorage.getItem('userSession') || '{}');
    if (!session.email) {
      this.showError('Please fill in your details first');
      return;
    }

    // Store current quiz ID and redirect
    localStorage.setItem('currentQuizId', quizId);
    window.location.href = 'quiz.html';
  }

  // Select subject
  selectSubject(e) {
    // Remove selection from all cards
    document.querySelectorAll('.subject-card').forEach(card => {
      card.classList.remove('selected');
    });

    // Add selection to clicked card
    const card = e.currentTarget;
    card.classList.add('selected');

    // Update hidden input
    const subject = card.dataset.subject;
    const hiddenInput = document.getElementById('selectedSubject');
    if (hiddenInput) {
      hiddenInput.value = subject;
    }

    // Enable start button
    this.updateStartButton();
  }

  // Update start button state
  updateStartButton() {
    const button = document.getElementById('startQuizBtn');
    const form = document.getElementById('preQuizForm');
    
    if (button && form) {
      const formData = new FormData(form);
      const isValid = formData.get('fullName') && 
                     formData.get('email') && 
                     formData.get('quizDate') && 
                     formData.get('subject');
      
      button.disabled = !isValid;
    }
  }

  // Filter quizzes
  filterQuizzes() {
    this.loadAvailableQuizzes();
  }

  // Utility methods
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  showError(message) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message
      });
    } else {
      alert(message);
    }
  }

  showSuccess(message) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: message,
        timer: 2000,
        showConfirmButton: false
      });
    }
  }
}

// Initialize the app when DOM is loaded
const quizApp = new QuizApp();

document.addEventListener('DOMContentLoaded', () => {
  quizApp.init();
});

// Form validation listeners
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('preQuizForm');
  if (form) {
    const inputs = form.querySelectorAll('input[required], select[required]');
    inputs.forEach(input => {
      input.addEventListener('change', () => quizApp.updateStartButton());
      input.addEventListener('input', () => quizApp.updateStartButton());
    });
  }
});

console.log('✅ App.js loaded successfully');