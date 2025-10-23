
 // Google Sheets API Integration - api.js
// Enhanced Version with Complete Functionality

// 🔴 IMPORTANT: Replace this URL with your actual Google Apps Script Web App URL
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxY3-M2neUJot9nt6t3ZiDZ_a5l5ZZgwAszvY2Dw7Knp9xCdIO76qJkUqBjK9eiimGi7g/exec';

// =========================================================
// CREATE QUIZ
// =========================================================
async function createQuizAPI(quizData) {
    try {
        console.log('📤 Sending quiz to Google Sheets...', quizData);
        const formData = new URLSearchParams({
            action: 'createQuiz',
            date: quizData.date,
            subject: quizData.subject,
            questionsJson: JSON.stringify(quizData.questions),
            totalQuestions: quizData.totalQuestions,
            timeLimit: quizData.timeLimit
        });

        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
            redirect: 'follow'
        });

        const result = await response.json();
        console.log('✅ Quiz API Response:', result);

        if (result.status === 'success') {
            return { status: 'success', data: result.data };
        } else {
            throw new Error(result.message || 'Failed to create quiz');
        }
    } catch (err) {
        console.error('❌ Create Quiz API Error:', err);
        throw err;
    }
}

// =========================================================
// SUBMIT QUIZ ATTEMPT
// =========================================================
async function submitQuizAPI(attemptData) {
    try {
        console.log('📤 Submitting quiz attempt to Google Sheets...', attemptData);
        const formData = new URLSearchParams({
            action: 'submitQuiz',
            quizId: attemptData.quizId,
            userName: attemptData.userName,
            email: attemptData.email,
            answersJson: attemptData.answersJson,
            score: attemptData.score,
            percentage: attemptData.percentage,
            timeTaken: attemptData.timeTaken,
            attemptDate: attemptData.attemptDate
        });

        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
            redirect: 'follow'
        });

        const result = await response.json();
        console.log('✅ Submit Quiz API Response:', result);

        if (result.status === 'success') {
            return { status: 'success', data: result.data };
        } else {
            throw new Error(result.message || 'Failed to submit quiz');
        }
    } catch (err) {
        console.error('❌ Submit Quiz API Error:', err);
        throw err;
    }
}

// =========================================================
// GET ALL QUIZZES
// =========================================================
async function getQuizzesAPI() {
    try {
        console.log('📥 Fetching quizzes from Google Sheets...');
        const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=getQuizzes`, {
            method: 'GET',
            redirect: 'follow'
        });

        const result = await response.json();
        console.log('📊 Quizzes fetch response:', result);

        if (result.status === 'success') {
            return result.data.quizzes || [];
        } else {
            throw new Error(result.message || 'Failed to fetch quizzes');
        }
    } catch (err) {
        console.error('❌ Get Quizzes API Error:', err);
        return [];
    }
}

// =========================================================
// GET LEADERBOARD - ENHANCED VERSION
// =========================================================
async function getLeaderboardAPI(quizId = 'all') {
    try {
        console.log(`📥 Fetching leaderboard from Google Sheets for quiz: ${quizId}`);
        const url = `${GOOGLE_APPS_SCRIPT_URL}?action=getLeaderboard&quizId=${quizId}`;
        console.log('📍 Request URL:', url);

        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('📊 Leaderboard API Response:', result);

        if (result.status === 'success') {
            const leaderboard = result.data.leaderboard || [];
            console.log(`✅ Fetched ${leaderboard.length} attempts from Google Sheets`);
            return leaderboard;
        } else {
            throw new Error(result.message || 'Failed to fetch leaderboard');
        }
    } catch (err) {
        console.error('❌ Get Leaderboard API Error:', err);
        console.error('Error details:', err.message);
        return [];
    }
}

// =========================================================
// CHECK API STATUS
// =========================================================
async function checkAPIStatus() {
    try {
        console.log('🔍 Checking API connection to:', GOOGLE_APPS_SCRIPT_URL);
        
        if (GOOGLE_APPS_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID_HERE')) {
            console.error('❌ Google Apps Script URL not configured!');
            return false;
        }

        const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=ping`, {
            method: 'GET',
            redirect: 'follow'
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ API Status Check:', result);
            return true;
        } else {
            console.error('❌ API returned non-OK status:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ API connection failed:', error.message);
        return false;
    }
}

// =========================================================
// SYNC QUIZZES FROM GOOGLE SHEETS
// =========================================================
async function syncQuizzesFromGoogleSheets() {
    try {
        console.log('🔄 Syncing quizzes from Google Sheets...');
        const serverQuizzes = await getQuizzesAPI();
        
        if (serverQuizzes && serverQuizzes.length > 0) {
            const localQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
            const quizMap = new Map();

            // Add server quizzes first (they are authoritative)
            serverQuizzes.forEach(quiz => {
                quizMap.set(quiz.quizId, quiz);
            });

            // Add local quizzes that don't exist on server
            localQuizzes.forEach(quiz => {
                if (!quizMap.has(quiz.quizId)) {
                    quizMap.set(quiz.quizId, quiz);
                }
            });

            const mergedQuizzes = Array.from(quizMap.values());
            localStorage.setItem('quizzes', JSON.stringify(mergedQuizzes));

            console.log(`✅ Synced ${serverQuizzes.length} quizzes from server`);
            console.log(`📊 Total quizzes after merge: ${mergedQuizzes.length}`);
            return true;
        }

        console.log('⚠️ No quizzes found on server');
        return false;
    } catch (e) {
        console.warn('⚠️ Could not sync from Google Sheets:', e.message);
        return false;
    }
}

// =========================================================
// SYNC ATTEMPTS FROM GOOGLE SHEETS
// =========================================================
async function syncAttemptsFromGoogleSheets() {
    try {
        console.log('🔄 Syncing attempts from Google Sheets...');
        const serverAttempts = await getLeaderboardAPI('all');
        
        if (serverAttempts && serverAttempts.length > 0) {
            const localAttempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
            const attemptMap = new Map();

            // Add server attempts first (they are authoritative)
            serverAttempts.forEach(attempt => {
                const key = `${attempt.email}_${attempt.quizId}_${attempt.date}`;
                attemptMap.set(key, attempt);
            });

            // Add local attempts that don't exist on server
            localAttempts.forEach(attempt => {
                const key = `${attempt.email}_${attempt.quizId}_${attempt.date}`;
                if (!attemptMap.has(key)) {
                    attemptMap.set(key, attempt);
                }
            });

            const mergedAttempts = Array.from(attemptMap.values());
            localStorage.setItem('quizAttempts', JSON.stringify(mergedAttempts));

            console.log(`✅ Synced ${serverAttempts.length} attempts from server`);
            console.log(`📊 Total attempts after merge: ${mergedAttempts.length}`);
            return true;
        }

        console.log('⚠️ No attempts found on server');
        return false;
    } catch (e) {
        console.warn('⚠️ Could not sync attempts:', e.message);
        return false;
    }
}

// =========================================================
// SAVE QUIZ (WRAPPER FOR CREATE QUIZ)
// =========================================================
async function saveQuizAPI(quizData) {
    return await createQuizAPI(quizData);
}

// =========================================================
// GET QUIZ BY ID
// =========================================================
async function getQuizByIdAPI(quizId) {
    try {
        const quizzes = await getQuizzesAPI();
        return quizzes.find(quiz => quiz.quizId === quizId) || null;
    } catch (err) {
        console.error('❌ Get Quiz By ID Error:', err);
        return null;
    }
}

// =========================================================
// BATCH OPERATIONS
// =========================================================
async function batchCreateQuizzesAPI(quizzesArray) {
    const results = [];
    for (const quiz of quizzesArray) {
        try {
            const result = await createQuizAPI(quiz);
            results.push({ success: true, quizId: quiz.quizId, result });
        } catch (error) {
            results.push({ success: false, quizId: quiz.quizId, error: error.message });
        }
    }
    return results;
}

// =========================================================
// EXPORT API OBJECT - COMPLETE VERSION
// =========================================================
window.QuizAPI = {
    // Core functions
    createQuiz: createQuizAPI,
    saveQuiz: saveQuizAPI,
    submitQuiz: submitQuizAPI,
    getQuizzes: getQuizzesAPI,
    getQuizById: getQuizByIdAPI,
    getLeaderboard: getLeaderboardAPI,
    
    // Sync functions
    sync: syncQuizzesFromGoogleSheets,
    syncAttempts: syncAttemptsFromGoogleSheets,
    
    // Batch operations
    batchCreateQuizzes: batchCreateQuizzesAPI,
    
    // Utility functions
    checkStatus: checkAPIStatus,
    
    // Config
    getConfig: () => ({
        url: GOOGLE_APPS_SCRIPT_URL,
        configured: !GOOGLE_APPS_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID_HERE')
    })
};

// Auto-initialization
window.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 QuizAPI Loaded - Enhanced Version');
    
    if (GOOGLE_APPS_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID_HERE')) {
        console.warn('⚠️ IMPORTANT: Please configure your Google Apps Script URL in api.js');
        console.warn('📝 Current URL needs to be replaced with your actual deployment URL');
    } else {
        console.log('🔗 API URL configured:', GOOGLE_APPS_SCRIPT_URL.substring(0, 50) + '...');
        
        // Check connection status
        checkAPIStatus().then(isConnected => {
            if (isConnected) {
                console.log('✅ Google Sheets API is READY and responding');
            } else {
                console.warn('⚠️ Google Sheets API is not responding - using local storage only');
            }
        });
    }
});

console.log('✅ api.js loaded - Enhanced Version 3.0 with complete functionality');

