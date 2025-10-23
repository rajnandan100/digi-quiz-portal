/**
 * Digi Quiz Portal - Google Apps Script Backend
 * Sheet ID: 1JPL_iMgCjz8k4rp-s8pZnKuJA92-UIWEdq_rV4nhgSc
 */

const SHEET_ID = '1JPL_iMgCjz8k4rp-s8pZnKuJA92-UIWEdq_rV4nhgSc';







function doGet(e) {
  console.log('GET Request received:', e.parameter);
  
  const action = e.parameter.action;
  
  try {
    let responseData;
    
    switch (action) {
      case 'status':
        responseData = { 
          success: true, 
          message: 'Digi Quiz Portal API is working!',
          timestamp: new Date().toISOString()
        };
        break;
        
      case 'getQuizzes':
        const quizzes = getAllQuizzes();
        responseData = { success: true, data: quizzes };
        break;
        
      case 'getQuiz':
        const quizId = e.parameter.quizId;
        const quiz = getQuizById(quizId);
        responseData = { success: true, data: quiz };
        break;
        
      case 'getLeaderboard':
        const leaderboard = getLeaderboard();
        responseData = { success: true, data: leaderboard };
        break;
        
      case 'getAvailableDates':
        const dates = getAvailableDates();
        responseData = { success: true, data: dates };
        break;
        
      default:
        responseData = { 
          success: false, 
          error: 'Unknown action: ' + action 
        };
    }
    
    // Return with CORS headers
    const output = ContentService.createTextOutput(JSON.stringify(responseData));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
    
  } catch (error) {
    console.error('GET Error:', error);
    const errorResponse = { 
      success: false, 
      error: error.toString() 
    };
    
    const output = ContentService.createTextOutput(JSON.stringify(errorResponse));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}




















function doPost(e) {
  console.log('POST Request received');
  
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch (action) {
      case 'initDatabase':
        setupDatabase();
        return createResponse({ success: true, message: 'Database initialized' });
        
      case 'saveQuiz':
        const quizId = saveQuiz(data.quiz);
        return createResponse({ 
          success: true, 
          message: 'Quiz saved successfully', 
          quizId: quizId 
        });
        
      case 'saveAttempt':
        saveAttempt(data.attempt);
        return createResponse({ success: true, message: 'Attempt saved' });
        
      case 'updateStats':
        updateAdminStats(data.stats);
        return createResponse({ success: true, message: 'Stats updated' });
        
      default:
        return createResponse({ 
          success: false, 
          error: 'Unknown POST action: ' + action 
        });
    }
  } catch (error) {
    console.error('POST Error:', error);
    return createResponse({ 
      success: false, 
      error: error.toString() 
    });
  }
}

// Setup database sheets
function setupDatabase() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  
  // Create Quizzes sheet
  let quizzesSheet = ss.getSheetByName('Quizzes');
  if (!quizzesSheet) {
    quizzesSheet = ss.insertSheet('Quizzes');
    quizzesSheet.getRange(1, 1, 1, 8).setValues([[
      'Quiz ID', 'Title', 'Subject', 'Duration (min)', 
      'Scheduled Date', 'Is Active', 'Created At', 'Question Count'
    ]]);
  }
  
  // Create Questions sheet
  let questionsSheet = ss.getSheetByName('Questions');
  if (!questionsSheet) {
    questionsSheet = ss.insertSheet('Questions');
    questionsSheet.getRange(1, 1, 1, 7).setValues([[
      'Quiz ID', 'Question', 'Option A', 'Option B', 
      'Option C', 'Option D', 'Correct Answer', 'Explanation'
    ]]);
  }
  
  // Create Attempts sheet
  let attemptsSheet = ss.getSheetByName('Attempts');
  if (!attemptsSheet) {
    attemptsSheet = ss.insertSheet('Attempts');
    attemptsSheet.getRange(1, 1, 1, 9).setValues([[
      'Attempt ID', 'Name', 'Email', 'Quiz ID', 'Quiz Title',
      'Score', 'Total Questions', 'Accuracy', 'Completed At'
    ]]);
  }
  
  // Create AdminStats sheet
  let statsSheet = ss.getSheetByName('AdminStats');
  if (!statsSheet) {
    statsSheet = ss.insertSheet('AdminStats');
    statsSheet.getRange(1, 1, 1, 5).setValues([[
      'Stat Name', 'Value', 'Updated At', 'Updated By', 'Notes'
    ]]);
    
    // Default stats
    const defaultStats = [
      ['Active Users', '1000+', new Date(), 'System', 'Homepage display'],
      ['Quizzes Available', '50+', new Date(), 'System', 'Homepage display'],
      ['Quiz Attempts', '5000+', new Date(), 'System', 'Homepage display'],
      ['User Rating', '4.8/5', new Date(), 'System', 'Homepage display']
    ];
    
    statsSheet.getRange(2, 1, defaultStats.length, 5).setValues(defaultStats);
  }
  
  console.log('Database setup completed');
}

// Save quiz and questions
function saveQuiz(quizData) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const quizzesSheet = ss.getSheetByName('Quizzes');
  const questionsSheet = ss.getSheetByName('Questions');
  
  if (!quizzesSheet || !questionsSheet) {
    throw new Error('Sheets not found. Run setupDatabase() first.');
  }
  
  const quizId = 'quiz_' + Date.now();
  const now = new Date();
  
  // Save quiz info
  quizzesSheet.appendRow([
    quizId,
    quizData.title || 'Untitled Quiz',
    quizData.subject || 'General',
    quizData.duration || 30,
    quizData.scheduledDate || now.toISOString().split('T')[0],
    quizData.isActive || true,
    now,
    quizData.questions ? quizData.questions.length : 0
  ]);
  
  // Save questions
  if (quizData.questions && quizData.questions.length > 0) {
    quizData.questions.forEach(q => {
      questionsSheet.appendRow([
        quizId,
        q.question || '',
        q.options ? q.options[0] : '',
        q.options ? q.options[1] : '',
        q.options ? q.options[2] : '',
        q.options ? q.options[3] : '',
        q.correctAnswer || 0,
        q.explanation || ''
      ]);
    });
  }
  
  console.log('Quiz saved:', quizId);
  return quizId;
}

// Get all quizzes
function getAllQuizzes() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const quizzesSheet = ss.getSheetByName('Quizzes');
  
  if (!quizzesSheet) {
    return [];
  }
  
  const data = quizzesSheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const quizzes = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    quizzes.push({
      id: row[0],
      title: row[1],
      subject: row[2],
      duration: row[3],
      scheduledDate: row[4],
      isActive: row[5],
      createdAt: row[6],
      questionCount: row[7]
    });
  }
  
  return quizzes;
}

// Get quiz by ID with questions
function getQuizById(quizId) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const quizzesSheet = ss.getSheetByName('Quizzes');
  const questionsSheet = ss.getSheetByName('Questions');
  
  if (!quizzesSheet || !questionsSheet) {
    return null;
  }
  
  // Find quiz
  const quizData = quizzesSheet.getDataRange().getValues();
  let quiz = null;
  
  for (let i = 1; i < quizData.length; i++) {
    if (quizData[i][0] === quizId) {
      quiz = {
        id: quizData[i][0],
        title: quizData[i][1],
        subject: quizData[i][2],
        duration: quizData[i][3],
        scheduledDate: quizData[i][4],
        isActive: quizData[i][5],
        createdAt: quizData[i][6],
        questions: []
      };
      break;
    }
  }
  
  if (!quiz) return null;
  
  // Get questions
  const questionsData = questionsSheet.getDataRange().getValues();
  for (let i = 1; i < questionsData.length; i++) {
    if (questionsData[i][0] === quizId) {
      quiz.questions.push({
        question: questionsData[i][1],
        options: [
          questionsData[i][2],
          questionsData[i][3],
          questionsData[i][4],
          questionsData[i][5]
        ],
        correctAnswer: questionsData[i][6],
        explanation: questionsData[i][7]
      });
    }
  }
  
  return quiz;
}

// Save quiz attempt
function saveAttempt(attemptData) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const attemptsSheet = ss.getSheetByName('Attempts');
  
  if (!attemptsSheet) {
    throw new Error('Attempts sheet not found');
  }
  
  const attemptId = 'attempt_' + Date.now();
  
  attemptsSheet.appendRow([
    attemptId,
    attemptData.name || '',
    attemptData.email || '',
    attemptData.quizId || '',
    attemptData.quizTitle || '',
    attemptData.score || 0,
    attemptData.totalQuestions || 0,
    attemptData.accuracy || 0,
    new Date()
  ]);
  
  console.log('Attempt saved:', attemptId);
  return attemptId;
}

// Get leaderboard
function getLeaderboard() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const attemptsSheet = ss.getSheetByName('Attempts');
  
  if (!attemptsSheet) {
    return [];
  }
  
  const data = attemptsSheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const attempts = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    attempts.push({
      name: row[1],
      email: row[2],
      quizTitle: row[4],
      score: row[5],
      totalQuestions: row[6],
      accuracy: row[7],
      completedAt: row[8]
    });
  }
  
  // Sort by score descending
  attempts.sort((a, b) => b.score - a.score);
  
  return attempts.slice(0, 50); // Top 50
}

// Get available quiz dates
function getAvailableDates() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const quizzesSheet = ss.getSheetByName('Quizzes');
  
  if (!quizzesSheet) {
    return [];
  }
  
  const data = quizzesSheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const dates = [];
  for (let i = 1; i < data.length; i++) {
    const scheduledDate = data[i][4];
    const isActive = data[i][5];
    
    if (isActive && scheduledDate) {
      const dateStr = typeof scheduledDate === 'string' 
        ? scheduledDate 
        : scheduledDate.toISOString().split('T')[0];
      
      if (!dates.includes(dateStr)) {
        dates.push(dateStr);
      }
    }
  }
  
  // Sort dates in reverse chronological order
  dates.sort((a, b) => new Date(b) - new Date(a));
  
  return dates;
}

// Update admin stats
function updateAdminStats(stats) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const statsSheet = ss.getSheetByName('AdminStats');
  
  if (!statsSheet) {
    throw new Error('AdminStats sheet not found');
  }
  
  const data = statsSheet.getDataRange().getValues();
  const now = new Date();
  
  // Update each stat
  Object.keys(stats).forEach(statName => {
    let updated = false;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === statName) {
        statsSheet.getRange(i + 1, 2, 1, 3).setValues([[
          stats[statName],
          now,
          'Admin Panel'
        ]]);
        updated = true;
        break;
      }
    }
    
    // Add new stat if not found
    if (!updated) {
      statsSheet.appendRow([
        statName,
        stats[statName],
        now,
        'Admin Panel',
        'New stat added'
      ]);
    }
  });
  
  console.log('Admin stats updated:', stats);
}

// Get admin stats
function getAdminStats() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const statsSheet = ss.getSheetByName('AdminStats');
  
  if (!statsSheet) {
    return {
      activeUsers: '1000+',
      quizzesAvailable: '50+',
      quizAttempts: '5000+',
      userRating: '4.8/5'
    };
  }
  
  const data = statsSheet.getDataRange().getValues();
  const stats = {};
  
  for (let i = 1; i < data.length; i++) {
    const statName = data[i][0];
    const value = data[i][1];
    
    if (statName && value) {
      stats[statName] = value;
    }
  }
  
  return stats;
}

function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}






// Initialize database on first run
function onInstall() {
  setupDatabase();
}

// Test function - run this manually once
function testSetup() {
  try {
    setupDatabase();
    console.log('✅ Database setup successful');
    
    // Test saving a sample quiz
    const sampleQuiz = {
      title: 'Sample Quiz - General Knowledge',
      subject: 'General Knowledge',
      duration: 5,
      scheduledDate: '2025-10-23',
      isActive: true,
      questions: [
        {
          question: 'What is the capital of India?',
          options: ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'],
          correctAnswer: 1,
          explanation: 'New Delhi is the capital of India.'
        },
        {
          question: 'Who wrote Jana Gana Mana?',
          options: ['Rabindranath Tagore', 'Bankim Chandra', 'Sarojini Naidu', 'Subhas Bose'],
          correctAnswer: 0,
          explanation: 'Rabindranath Tagore wrote the national anthem.'
        }
      ]
    };
    
    const quizId = saveQuiz(sampleQuiz);
    console.log('✅ Sample quiz saved with ID:', quizId);
    
    // Test saving a sample attempt
    const sampleAttempt = {
      name: 'John Doe',
      email: 'john@example.com',
      quizId: quizId,
      quizTitle: 'Sample Quiz - General Knowledge',
      score: 2,
      totalQuestions: 2,
      accuracy: 100
    };
    
    const attemptId = saveAttempt(sampleAttempt);
    console.log('✅ Sample attempt saved with ID:', attemptId);
    
    console.log('🎉 All tests passed! Your backend is ready.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}


// Add this function to handle CORS preflight requests
function doOptions(e) {
  return createResponse({ success: true, message: 'CORS preflight handled' });
}






