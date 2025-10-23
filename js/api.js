/**
 * Digi Quiz Portal API Client
 * Connects frontend quiz portal with Google Sheets backend via Google Apps Script web app
 */

class QuizAPI {
  constructor() {
    // Replace with your actual deployed Google Apps Script Web App URL
    this.baseUrl = 'https://script.google.com/macros/s/AKfycbyyt0G6mQvnjnzlMyOYQUvPnheZYPz3kn6zOjSpkCeH_tTKvVm1tZ1lZfmMNnSZ8XheKw/exec';
    console.log('🚀 Digi Quiz Portal API initialized');
  }

  async makeRequest(action, data = {}) {
    try {
      console.log(`📡 API Request: ${action}`);
      
      const payload = { action, ...data };
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`✅ ${action} success:`, result.success);
      if (!result.success) {
        console.warn(`API ${action} warning:`, result.error);
      }
      return result;
    } catch (error) {
      console.error(`❌ ${action} failed:`, error);
      return { success: false, error: error.message };
    }
  }

  async checkStatus() {
    try {
      const response = await fetch(`${this.baseUrl}?action=status`);
      const result = await response.json();
      console.log('📊 API Status:', result.message);
      return result.success;
    } catch (error) {
      console.error('❌ Status check failed:', error);
      return false;
    }
  }

  async initializeDatabase() {
    return await this.makeRequest('initDatabase');
  }






  async saveQuiz(quiz) {
  try {
    console.log('📡 Saving quiz via GET request...');
    
    // Encode quiz data for URL
    const quizJSON = JSON.stringify(quiz);
    const encodedData = encodeURIComponent(quizJSON);
    
    // Use GET request to avoid CORS preflight
    const url = `${this.baseUrl}?action=saveQuiz&data=${encodedData}`;
    const response = await fetch(url);
    const result = await response.json();
    
    console.log('✅ Quiz save result:', result);
    return result;
  } catch (error) {
    console.error('❌ Save quiz failed:', error);
    return { success: false, error: error.message };
  }
}









  






  

  async getQuizzes() {
    try {
      const response = await fetch(`${this.baseUrl}?action=getQuizzes`);
      const result = await response.json();
      if (result.success) return result.data;
      return [];
    } catch (error) {
      console.error('❌ Get quizzes failed:', error);
      return [];
    }
  }

  async getQuiz(quizId) {
    try {
      const response = await fetch(`${this.baseUrl}?action=getQuiz&quizId=${quizId}`);
      const result = await response.json();
      if (result.success) return result.data;
      return null;
    } catch (error) {
      console.error('❌ Get quiz failed:', error);
      return null;
    }
  }

  async saveAttempt(attempt) {
    const result = await this.makeRequest('saveAttempt', { attempt });
    return result.success;
  }

  async getLeaderboard(quizId = 'all') {
    try {
      const url = quizId === 'all' 
        ? `${this.baseUrl}?action=getLeaderboard`
        : `${this.baseUrl}?action=getLeaderboard&quizId=${quizId}`;
        
      const response = await fetch(url);
      const result = await response.json();
      if (result.success) return result.data;
      return [];
    } catch (error) {
      console.error('❌ Get leaderboard failed:', error);
      return [];
    }
  }
}

// Create a global instance
window.QuizAPI = new QuizAPI();
console.log('✅ Digi Quiz Portal API loaded');

// Don't auto-check status - let admin panel do it when ready
console.log('🔗 API URL:', window.QuizAPI.baseUrl);
