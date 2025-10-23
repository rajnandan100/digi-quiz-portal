/**
 * Enhanced Digi Quiz Portal - Google Sheets Database Management
 * With Admin Panel Support for Commercial Use
 */

// Configuration
const CONFIG = {
  SHEETS: {
    QUIZZES: 'Quizzes',
    QUESTIONS: 'Questions', 
    ATTEMPTS: 'Attempts',
    USERS: 'Users',
    LEADERBOARD: 'Leaderboard',
    ADMIN_STATS: 'AdminStats',
    SETTINGS: 'Settings'
  },
  
  HEADERS: {
    QUIZZES: ['id', 'title', 'description', 'subject', 'duration', 'totalQuestions', 'createdAt', 'scheduledDate', 'isActive', 'isVisible'],
    QUESTIONS: ['quizId', 'questionId', 'question', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer', 'explanation'],
    ATTEMPTS: ['id', 'userName', 'userEmail', 'userPhone', 'quizId', 'score', 'totalQuestions', 'percentage', 'timeTaken', 'completedAt', 'answers'],
    USERS: ['id', 'name', 'email', 'phone', 'registeredAt', 'totalAttempts', 'bestScore'],
    LEADERBOARD: ['rank', 'userName', 'quizId', 'quizTitle', 'score', 'percentage', 'timeTaken', 'completedAt'],
    ADMIN_STATS: ['statName', 'statValue', 'updatedAt'],
    SETTINGS: ['settingName', 'settingValue', 'updatedAt']
  }
};

/**
 * Initialize the database - Run this function first
 */
function initializeDatabase() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Create all required sheets
    Object.values(CONFIG.SHEETS).forEach(sheetName => {
      let sheet = ss.getSheetByName(sheetName);
      
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      
      // Add headers if sheet is empty
      if (sheet.getLastRow() === 0) {
        const headers = CONFIG.HEADERS[Object.keys(CONFIG.SHEETS).find(key => CONFIG.SHEETS[key] === sheetName)];
        if (headers) {
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#e8f0fe');
        }
      }
    });
    
    // Initialize default admin stats
    initializeDefaultStats();
    
    return { success: true, message: 'Database initialized successfully!' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Initialize default admin statistics
 */
function initializeDefaultStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const statsSheet = ss.getSheetByName(CONFIG.SHEETS.ADMIN_STATS);
  
  if (statsSheet && statsSheet.getLastRow() <= 1) {
    const defaultStats = [
      ['totalUsers', '1000+', new Date()],
      ['totalQuizzes', '50+', new Date()],
      ['totalAttempts', '5000+', new Date()],
      ['userRating', '4.8/5', new Date()]
    ];
    
    statsSheet.getRange(2, 1, defaultStats.length, 3).setValues(defaultStats);
  }
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createResponse({ success: false, error: 'No data received' });
    }

    const data = JSON.parse(e.postData.contents);
    
    switch (data.action) {
      case 'saveQuiz':
        return createResponse(saveQuiz(data.quiz));
      case 'getQuizzes':
        return createResponse(getQuizzes());
      case 'getQuiz':
        return createResponse(getQuiz(data.quizId));
      case 'updateQuiz':
        return createResponse(updateQuiz(data.quizId, data.updates));
      case 'deleteQuiz':
        return createResponse(deleteQuiz(data.quizId));
      case 'saveAttempt':
        return createResponse(saveAttempt(data.attempt));
      case 'getLeaderboard':
        return createResponse(getLeaderboard(data.quizId));
      case 'updateAdminStats':
        return createResponse(updateAdminStats(data.stats));
      case 'getAdminStats':
        return createResponse(getAdminStats());
      case 'getAvailableDates':
        return createResponse(getAvailableQuizDates());
      case 'initDatabase':
        return createResponse(initializeDatabase());
      default:
        return createResponse({ success: false, error: 'Invalid action: ' + data.action });
    }
  } catch (error) {
    return createResponse({ success: false, error: 'POST Error: ' + error.toString() });
  }
}

/**
 * Handle GET requests
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'status';
    
    switch (action) {
      case 'status':
        return createResponse({ success: true, message: 'Digi Quiz Portal API is running!' });
      case 'getQuizzes':
        return createResponse(getQuizzes());
      case 'getQuiz':
        if (e.parameter.quizId) {
          return createResponse(getQuiz(e.parameter.quizId));
        }
        return createResponse({ success: false, error: 'Quiz ID required' });
      case 'getLeaderboard':
        return createResponse(getLeaderboard(e.parameter.quizId));
      case 'getAdminStats':
        return createResponse(getAdminStats());
      case 'getAvailableDates':
        return createResponse(getAvailableQuizDates());
      case 'test':
        return createResponse({ success: true, message: 'Test successful', timestamp: new Date() });
      default:
        return createResponse({ success: true, message: 'Digi Quiz Portal API' });
    }
  } catch (error) {
    return createResponse({ success: false, error: 'GET Error: ' + error.toString() });
  }
}

/**
 * Create CORS-enabled response
 */
function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

/**
 * Save quiz with enhanced features
 */
function saveQuiz(quizData) {
  try {
    if (!quizData) {
      return { success: false, error: 'Quiz data is required' };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let quizSheet = ss.getSheetByName(CONFIG.SHEETS.QUIZZES);
    let questionSheet = ss.getSheetByName(CONFIG.SHEETS.QUESTIONS);
    
    if (!quizSheet || !questionSheet) {
      initializeDatabase();
      quizSheet = ss.getSheetByName(CONFIG.SHEETS.QUIZZES);
      questionSheet = ss.getSheetByName(CONFIG.SHEETS.QUESTIONS);
    }
    
    const quizId = quizData.id || generateId();
    const timestamp = new Date();
    
    // Determine visibility based on schedule
    const scheduledDate = quizData.scheduledDate ? new Date(quizData.scheduledDate) : null;
    const currentDate = new Date();
    const isVisible = !scheduledDate || scheduledDate <= currentDate;
    
    // Save quiz metadata with enhanced fields
    const quizRow = [
      quizId,
      quizData.title || 'Untitled Quiz',
      quizData.description || '',
      quizData.subject || 'General Knowledge',
      quizData.duration || 30,
      quizData.questions ? quizData.questions.length : 0,
      timestamp,
      scheduledDate || '',
      quizData.isActive !== false, // Default to true
      isVisible
    ];
    
    quizSheet.appendRow(quizRow);
    
    // Save questions
    if (quizData.questions && Array.isArray(quizData.questions) && quizData.questions.length > 0) {
      quizData.questions.forEach((question, index) => {
        const questionRow = [
          quizId,
          index + 1,
          question.question || '',
          question.options ? question.options[0] || '' : '',
          question.options ? question.options[1] || '' : '',
          question.options ? question.options[2] || '' : '',
          question.options ? question.options[3] || '' : '',
          question.correctAnswer || '',
          question.explanation || ''
        ];
        questionSheet.appendRow(questionRow);
      });
    }
    
    return { success: true, quizId: quizId, message: 'Quiz saved successfully!' };
  } catch (error) {
    return { success: false, error: 'Save quiz error: ' + error.toString() };
  }
}

/**
 * Get quizzes with visibility logic
 */
function getQuizzes() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.QUIZZES);
    
    if (!sheet || sheet.getLastRow() < 2) {
      return { success: true, data: [] };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const currentDate = new Date();
    
    const quizzes = data.slice(1)
      .map(row => {
        const quiz = {};
        headers.forEach((header, index) => {
          quiz[header] = row[index];
        });
        return quiz;
      })
      .filter(quiz => {
        // Check if quiz should be visible
        if (!quiz.isActive) return false;
        
        if (quiz.scheduledDate && quiz.scheduledDate !== '') {
          const scheduledDate = new Date(quiz.scheduledDate);
          return scheduledDate <= currentDate;
        }
        
        return quiz.isVisible !== false;
      });
    
    return { success: true, data: quizzes };
  } catch (error) {
    return { success: false, error: 'Get quizzes error: ' + error.toString() };
  }
}

/**
 * Get specific quiz with questions
 */
function getQuiz(quizId) {
  try {
    if (!quizId) {
      return { success: false, error: 'Quiz ID is required' };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const quizSheet = ss.getSheetByName(CONFIG.SHEETS.QUIZZES);
    const questionSheet = ss.getSheetByName(CONFIG.SHEETS.QUESTIONS);
    
    if (!quizSheet || !questionSheet) {
      return { success: false, error: 'Database not initialized' };
    }
    
    // Get quiz data
    const quizData = quizSheet.getDataRange().getValues();
    if (quizData.length < 2) {
      return { success: false, error: 'No quizzes found' };
    }
    
    const quizHeaders = quizData[0];
    const quizRow = quizData.slice(1).find(row => row[0] === quizId);
    
    if (!quizRow) {
      return { success: false, error: 'Quiz not found' };
    }
    
    const quiz = {};
    quizHeaders.forEach((header, index) => {
      quiz[header] = quizRow[index];
    });
    
    // Get questions
    const questionData = questionSheet.getDataRange().getValues();
    const questions = [];
    
    if (questionData.length > 1) {
      const questionRows = questionData.slice(1).filter(row => row[0] === quizId);
      
      questionRows.forEach(row => {
        questions.push({
          id: row[1],
          question: row[2],
          options: [row[3], row[4], row[5], row[6]],
          correctAnswer: row[7],
          explanation: row[8]
        });
      });
    }
    
    quiz.questions = questions;
    
    return { success: true, data: quiz };
  } catch (error) {
    return { success: false, error: 'Get quiz error: ' + error.toString() };
  }
}

/**
 * Update quiz (for admin panel)
 */
function updateQuiz(quizId, updates) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.QUIZZES);
    
    if (!sheet) {
      return { success: false, error: 'Quiz sheet not found' };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rowIndex = data.slice(1).findIndex(row => row[0] === quizId);
    
    if (rowIndex === -1) {
      return { success: false, error: 'Quiz not found' };
    }
    
    const actualRowIndex = rowIndex + 2; // +1 for header, +1 for 0-based index
    
    // Update specified fields
    Object.keys(updates).forEach(field => {
      const columnIndex = headers.indexOf(field);
      if (columnIndex !== -1) {
        sheet.getRange(actualRowIndex, columnIndex + 1).setValue(updates[field]);
      }
    });
    
    return { success: true, message: 'Quiz updated successfully' };
  } catch (error) {
    return { success: false, error: 'Update quiz error: ' + error.toString() };
  }
}

/**
 * Delete quiz (for admin panel)
 */
function deleteQuiz(quizId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const quizSheet = ss.getSheetByName(CONFIG.SHEETS.QUIZZES);
    const questionSheet = ss.getSheetByName(CONFIG.SHEETS.QUESTIONS);
    
    // Delete quiz
    const quizData = quizSheet.getDataRange().getValues();
    const quizRowIndex = quizData.slice(1).findIndex(row => row[0] === quizId);
    
    if (quizRowIndex !== -1) {
      quizSheet.deleteRow(quizRowIndex + 2);
    }
    
    // Delete associated questions
    const questionData = questionSheet.getDataRange().getValues();
    const questionRowsToDelete = [];
    
    questionData.slice(1).forEach((row, index) => {
      if (row[0] === quizId) {
        questionRowsToDelete.push(index + 2);
      }
    });
    
    // Delete in reverse order to maintain row indices
    questionRowsToDelete.reverse().forEach(rowIndex => {
      questionSheet.deleteRow(rowIndex);
    });
    
    return { success: true, message: 'Quiz deleted successfully' };
  } catch (error) {
    return { success: false, error: 'Delete quiz error: ' + error.toString() };
  }
}

/**
 * Update admin statistics
 */
function updateAdminStats(stats) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let statsSheet = ss.getSheetByName(CONFIG.SHEETS.ADMIN_STATS);
    
    if (!statsSheet) {
      initializeDatabase();
      statsSheet = ss.getSheetByName(CONFIG.SHEETS.ADMIN_STATS);
    }
    
    const timestamp = new Date();
    
    // Update each stat
    Object.keys(stats).forEach(statName => {
      const data = statsSheet.getDataRange().getValues();
      const rowIndex = data.slice(1).findIndex(row => row[0] === statName);
      
      if (rowIndex !== -1) {
        // Update existing stat
        const actualRowIndex = rowIndex + 2;
        statsSheet.getRange(actualRowIndex, 2).setValue(stats[statName]);
        statsSheet.getRange(actualRowIndex, 3).setValue(timestamp);
      } else {
        // Add new stat
        statsSheet.appendRow([statName, stats[statName], timestamp]);
      }
    });
    
    return { success: true, message: 'Statistics updated successfully' };
  } catch (error) {
    return { success: false, error: 'Update stats error: ' + error.toString() };
  }
}

/**
 * Get admin statistics
 */
function getAdminStats() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.ADMIN_STATS);
    
    if (!sheet || sheet.getLastRow() < 2) {
      return { success: true, data: {} };
    }
    
    const data = sheet.getDataRange().getValues();
    const stats = {};
    
    data.slice(1).forEach(row => {
      stats[row[0]] = row[1];
    });
    
    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: 'Get stats error: ' + error.toString() };
  }
}

/**
 * Get available quiz dates
 */
function getAvailableQuizDates() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.QUIZZES);
    
    if (!sheet || sheet.getLastRow() < 2) {
      return { success: true, data: [] };
    }
    
    const data = sheet.getDataRange().getValues();
    const dates = new Set();
    
    data.slice(1).forEach(row => {
      const scheduledDate = row[7]; // scheduledDate column
      const isActive = row[8];
      const isVisible = row[9];
      
      if (isActive && (scheduledDate && scheduledDate !== '')) {
        const dateStr = new Date(scheduledDate).toISOString().split('T')[0];
        dates.add(dateStr);
      }
    });
    
    // Add today and yesterday as default
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    dates.add(today.toISOString().split('T')[0]);
    dates.add(yesterday.toISOString().split('T')[0]);
    
    return { success: true, data: Array.from(dates).sort().reverse() };
  } catch (error) {
    return { success: false, error: 'Get dates error: ' + error.toString() };
  }
}

/**
 * Save user attempt (enhanced)
 */
function saveAttempt(attemptData) {
  try {
    if (!attemptData) {
      return { success: false, error: 'Attempt data is required' };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let attemptSheet = ss.getSheetByName(CONFIG.SHEETS.ATTEMPTS);
    
    if (!attemptSheet) {
      initializeDatabase();
      attemptSheet = ss.getSheetByName(CONFIG.SHEETS.ATTEMPTS);
    }
    
    const attemptId = generateId();
    const timestamp = new Date();
    const percentage = attemptData.totalQuestions > 0 ? 
      Math.round((attemptData.score / attemptData.totalQuestions) * 100) : 0;
    
    // Save attempt
    const attemptRow = [
      attemptId,
      attemptData.userName || 'Anonymous',
      attemptData.userEmail || '',
      attemptData.userPhone || '',
      attemptData.quizId || '',
      attemptData.score || 0,
      attemptData.totalQuestions || 0,
      percentage,
      attemptData.timeTaken || 0,
      timestamp,
      JSON.stringify(attemptData.answers || [])
    ];
    
    attemptSheet.appendRow(attemptRow);
    
    // Update/create user
    updateUser(attemptData, timestamp);
    
    // Update leaderboard
    updateLeaderboard(attemptData, timestamp);
    
    return { success: true, attemptId: attemptId, message: 'Attempt saved successfully!' };
  } catch (error) {
    return { success: false, error: 'Save attempt error: ' + error.toString() };
  }
}

/**
 * Update user data
 */
function updateUser(attemptData, timestamp) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let userSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
    
    if (!userSheet) {
      initializeDatabase();
      userSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
    }
    
    if (userSheet.getLastRow() < 2) {
      // First user - create new
      const userId = generateId();
      const userRow = [
        userId,
        attemptData.userName || 'Anonymous',
        attemptData.userEmail || '',
        attemptData.userPhone || '',
        timestamp,
        1, // totalAttempts
        attemptData.score || 0 // bestScore
      ];
      userSheet.appendRow(userRow);
      return;
    }
    
    const userData = userSheet.getDataRange().getValues();
    const userRowIndex = userData.slice(1).findIndex(row => row[2] === attemptData.userEmail);
    
    if (userRowIndex === -1) {
      // Create new user
      const userId = generateId();
      const userRow = [
        userId,
        attemptData.userName || 'Anonymous',
        attemptData.userEmail || '',
        attemptData.userPhone || '',
        timestamp,
        1, // totalAttempts
        attemptData.score || 0 // bestScore
      ];
      userSheet.appendRow(userRow);
    } else {
      // Update existing user
      const actualRowIndex = userRowIndex + 2;
      const currentAttempts = userData[userRowIndex + 1][5] || 0;
      const currentBestScore = userData[userRowIndex + 1][6] || 0;
      
      userSheet.getRange(actualRowIndex, 6).setValue(currentAttempts + 1);
      if ((attemptData.score || 0) > currentBestScore) {
        userSheet.getRange(actualRowIndex, 7).setValue(attemptData.score || 0);
      }
    }
  } catch (error) {
    // Silent fail for user update
  }
}

/**
 * Update leaderboard
 */
function updateLeaderboard(attemptData, timestamp) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let leaderboardSheet = ss.getSheetByName(CONFIG.SHEETS.LEADERBOARD);
    let quizSheet = ss.getSheetByName(CONFIG.SHEETS.QUIZZES);
    
    if (!leaderboardSheet || !quizSheet) {
      initializeDatabase();
      leaderboardSheet = ss.getSheetByName(CONFIG.SHEETS.LEADERBOARD);
      quizSheet = ss.getSheetByName(CONFIG.SHEETS.QUIZZES);
    }
    
    // Get quiz title
    let quizTitle = 'Unknown Quiz';
    if (quizSheet.getLastRow() > 1) {
      const quizData = quizSheet.getDataRange().getValues();
      const quizRow = quizData.slice(1).find(row => row[0] === attemptData.quizId);
      if (quizRow) {
        quizTitle = quizRow[1];
      }
    }
    
    const percentage = attemptData.totalQuestions > 0 ? 
      Math.round((attemptData.score / attemptData.totalQuestions) * 100) : 0;
    
    // Add to leaderboard
    const leaderboardRow = [
      0, // Rank will be calculated
      attemptData.userName || 'Anonymous',
      attemptData.quizId || '',
      quizTitle,
      attemptData.score || 0,
      percentage,
      attemptData.timeTaken || 0,
      timestamp
    ];
    
    leaderboardSheet.appendRow(leaderboardRow);
    
    // Sort and update ranks
    sortLeaderboard();
  } catch (error) {
    // Silent fail for leaderboard update
  }
}

/**
 * Sort leaderboard and assign ranks
 */
function sortLeaderboard() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.LEADERBOARD);
    
    if (!sheet || sheet.getLastRow() < 2) return;
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    if (rows.length === 0) return;
    
    // Sort by percentage (desc), then by time (asc)
    rows.sort((a, b) => {
      const percentageA = parseFloat(a[5]) || 0;
      const percentageB = parseFloat(b[5]) || 0;
      
      if (percentageB !== percentageA) return percentageB - percentageA;
      
      const timeA = parseFloat(a[6]) || 0;
      const timeB = parseFloat(b[6]) || 0;
      return timeA - timeB;
    });
    
    // Update ranks
    rows.forEach((row, index) => {
      row[0] = index + 1;
    });
    
    // Update sheet
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#e8f0fe');
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
  } catch (error) {
    // Silent fail for sorting
  }
}

/**
 * Get leaderboard data
 */
function getLeaderboard(quizId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.LEADERBOARD);
    
    if (!sheet || sheet.getLastRow() < 2) {
      return { success: true, data: [] };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    let leaderboard = data.slice(1).map(row => {
      const entry = {};
      headers.forEach((header, index) => {
        entry[header] = row[index];
      });
      return entry;
    });
    
    // Filter by quiz if specified
    if (quizId && quizId !== 'all' && quizId !== '') {
      leaderboard = leaderboard.filter(entry => entry.quizId === quizId);
      
      // Re-rank filtered results
      leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
      });
    }
    
    return { success: true, data: leaderboard };
  } catch (error) {
    return { success: false, error: 'Get leaderboard error: ' + error.toString() };
  }
}

/**
 * Generate unique ID
 */
function generateId() {
  return 'qz_' + Utilities.getUuid().replace(/-/g, '').substring(0, 10);
}

/**
 * Setup function - Run this to initialize your database
 */
function setupDatabase() {
  const result = initializeDatabase();
  return result;
}

/**
 * Test API functionality
 */
function testAPI() {
  return {
    success: true,
    message: 'Enhanced API is working correctly',
    timestamp: new Date(),
    sheets: Object.values(CONFIG.SHEETS)
  };
}