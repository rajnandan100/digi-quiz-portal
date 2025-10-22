// API functions for Google Sheets integration

class QuizAPI {
  constructor() {
    this.baseUrl = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
    this.sheetId = 'YOUR_SHEET_ID';
    console.log('📡 QuizAPI initialized');
  }

  // Check API status
  async checkStatus() {
    try {
      console.log('🔍 Checking API status...');
      // For now, return false to use local storage
      return false;
    } catch (error) {
      console.error('API status check failed:', error);
      return false;
    }
  }

  // Save quiz attempt (placeholder)
  async saveAttempt(attempt) {
    try {
      console.log('💾 Saving attempt to local storage');
      const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
      attempts.push(attempt);
      localStorage.setItem('quizAttempts', JSON.stringify(attempts));
      return true;
    } catch (error) {
      console.error('Save attempt error:', error);
      return false;
    }
  }

  // Get leaderboard (placeholder)
  async getLeaderboard(quizId = 'all') {
    try {
      console.log('📊 Getting leaderboard from local storage');
      const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
      
      if (quizId === 'all') {
        return attempts;
      }
      
      return attempts.filter(attempt => attempt.quizId === quizId);
    } catch (error) {
      console.error('Get leaderboard error:', error);
      return [];
    }
  }

  // Save quiz data (placeholder)
  async saveQuiz(quiz) {
    try {
      console.log('💾 Saving quiz to local storage');
      const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
      quizzes.push(quiz);
      localStorage.setItem('quizzes', JSON.stringify(quizzes));
      return true;
    } catch (error) {
      console.error('Save quiz error:', error);
      return false;
    }
  }

  // Get quizzes (placeholder)
  async getQuizzes() {
    try {
      console.log('📚 Getting quizzes from local storage');
      return JSON.parse(localStorage.getItem('quizzes') || '[]');
    } catch (error) {
      console.error('Get quizzes error:', error);
      return [];
    }
  }
}

// Create global QuizAPI instance
window.QuizAPI = new QuizAPI();
console.log('✅ API.js loaded successfully');