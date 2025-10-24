// Firebase Quiz Data Service
// DigiQuiz Portal - Quiz Management
// ================================

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  writeBatch,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { db } from './firebase-config.js';
import { getCurrentUser } from './firebase-auth.js';

// Collections
const COLLECTIONS = {
  QUIZZES: 'quizzes',
  ATTEMPTS: 'attempts', 
  USERS: 'users',
  LEADERBOARD: 'leaderboard',
  ANALYTICS: 'analytics'
};

// Quiz Events
export const QUIZ_EVENTS = {
  QUIZ_CREATED: 'quiz:created',
  QUIZ_UPDATED: 'quiz:updated',
  QUIZ_DELETED: 'quiz:deleted',
  ATTEMPT_SUBMITTED: 'attempt:submitted',
  LEADERBOARD_UPDATED: 'leaderboard:updated'
};

// =====================
// QUIZ MANAGEMENT
// =====================

// Create new quiz (Admin function)
export async function createQuiz(quizData) {
  try {
    console.log('📝 Creating new quiz...');
    
    const quiz = {
      ...quizData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: getCurrentUser()?.uid || 'admin',
      attempts: 0,
      averageScore: 0,
      status: 'active'
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.QUIZZES), quiz);
    
    console.log('✅ Quiz created with ID:', docRef.id);
    
    // Dispatch event
    dispatchQuizEvent(QUIZ_EVENTS.QUIZ_CREATED, { 
      quizId: docRef.id, 
      quiz: quiz 
    });
    
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Failed to create quiz:', error);
    throw error;
  }
}

// Get all available quizzes
export async function getAvailableQuizzes(filters = {}) {
  try {
    console.log('📚 Fetching available quizzes...');
    
    let q = collection(db, COLLECTIONS.QUIZZES);
    
    // Apply filters
    const queryConstraints = [where('status', '==', 'active')];
    
    if (filters.subject) {
      queryConstraints.push(where('subject', '==', filters.subject));
    }
    
    if (filters.date) {
      queryConstraints.push(where('date', '==', filters.date));
    }
    
    if (filters.difficulty) {
      queryConstraints.push(where('difficulty', '==', filters.difficulty));
    }
    
    // Add ordering
    queryConstraints.push(orderBy('createdAt', 'desc'));
    
    // Apply limit if specified
    if (filters.limit) {
      queryConstraints.push(limit(filters.limit));
    }
    
    q = query(q, ...queryConstraints);
    
    const querySnapshot = await getDocs(q);
    const quizzes = [];
    
    querySnapshot.forEach((doc) => {
      quizzes.push({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamps
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
      });
    });
    
    console.log(`✅ Found ${quizzes.length} quizzes`);
    return quizzes;
    
  } catch (error) {
    console.error('❌ Failed to fetch quizzes:', error);
    throw error;
  }
}

// Get specific quiz by ID
export async function getQuizById(quizId) {
  try {
    console.log('🔍 Fetching quiz:', quizId);
    
    const docRef = doc(db, COLLECTIONS.QUIZZES, quizId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date()
      };
    } else {
      throw new Error('Quiz not found');
    }
    
  } catch (error) {
    console.error('❌ Failed to fetch quiz:', error);
    throw error;
  }
}

// =====================
// QUIZ ATTEMPTS
// =====================

// Submit quiz attempt
export async function submitQuizAttempt(quizId, attemptData) {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    
    console.log('📤 Submitting quiz attempt...');
    
    const attempt = {
      quizId: quizId,
      userId: user.uid,
      userName: user.displayName,
      userEmail: user.email,
      userPhoto: user.photoURL,
      ...attemptData,
      submittedAt: serverTimestamp(),
      deviceInfo: {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    };
    
    // Use batch write for atomic operations
    const batch = writeBatch(db);
    
    // Add attempt
    const attemptRef = doc(collection(db, COLLECTIONS.ATTEMPTS));
    batch.set(attemptRef, attempt);
    
    // Update quiz stats
    const quizRef = doc(db, COLLECTIONS.QUIZZES, quizId);
    batch.update(quizRef, {
      attempts: increment(1),
      updatedAt: serverTimestamp()
    });
    
    // Update user stats
    const userRef = doc(db, COLLECTIONS.USERS, user.uid);
    batch.update(userRef, {
      totalQuizzes: increment(1),
      totalScore: increment(attemptData.score || 0),
      lastQuizDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Commit batch
    await batch.commit();
    
    console.log('✅ Quiz attempt submitted successfully');
    
    // Update leaderboard asynchronously
    updateLeaderboard(user.uid, attemptData);
    
    // Dispatch event
    dispatchQuizEvent(QUIZ_EVENTS.ATTEMPT_SUBMITTED, {
      attemptId: attemptRef.id,
      quizId: quizId,
      userId: user.uid,
      score: attemptData.score
    });
    
    return attemptRef.id;
    
  } catch (error) {
    console.error('❌ Failed to submit quiz attempt:', error);
    throw error;
  }
}

// Get user's quiz attempts
export async function getUserAttempts(userId = null, options = {}) {
  try {
    const targetUserId = userId || getCurrentUser()?.uid;
    if (!targetUserId) throw new Error('User ID required');
    
    console.log('📊 Fetching user attempts...');
    
    let q = query(
      collection(db, COLLECTIONS.ATTEMPTS),
      where('userId', '==', targetUserId),
      orderBy('submittedAt', 'desc')
    );
    
    if (options.limit) {
      q = query(q, limit(options.limit));
    }
    
    const querySnapshot = await getDocs(q);
    const attempts = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      attempts.push({
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt?.toDate?.() || new Date()
      });
    });
    
    console.log(`✅ Found ${attempts.length} attempts for user`);
    return attempts;
    
  } catch (error) {
    console.error('❌ Failed to fetch user attempts:', error);
    throw error;
  }
}

// =====================
// LEADERBOARD
// =====================

// Get leaderboard data
export async function getLeaderboard(options = {}) {
  try {
    console.log('🏆 Fetching leaderboard...');
    
    let q = query(
      collection(db, COLLECTIONS.ATTEMPTS),
      orderBy('percentage', 'desc'),
      orderBy('timeTaken', 'asc')
    );
    
    if (options.limit) {
      q = query(q, limit(options.limit));
    }
    
    if (options.subject) {
      q = query(q, where('subject', '==', options.subject));
    }
    
    const querySnapshot = await getDocs(q);
    const leaderboard = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      leaderboard.push({
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt?.toDate?.() || new Date()
      });
    });
    
    // Add ranking
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    console.log(`✅ Leaderboard loaded with ${leaderboard.length} entries`);
    return leaderboard;
    
  } catch (error) {
    console.error('❌ Failed to fetch leaderboard:', error);
    throw error;
  }
}

// Update leaderboard (internal function)
async function updateLeaderboard(userId, attemptData) {
  try {
    // This could be enhanced with more complex ranking logic
    console.log('🏆 Updating leaderboard for user:', userId);
    
    // For now, we'll rely on real-time queries
    // Future enhancement: maintain a separate leaderboard collection
    
  } catch (error) {
    console.error('❌ Failed to update leaderboard:', error);
  }
}

// =====================
// REAL-TIME UPDATES
// =====================

// Listen to quiz updates
export function listenToQuizzes(callback, filters = {}) {
  try {
    let q = query(
      collection(db, COLLECTIONS.QUIZZES),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    if (filters.subject) {
      q = query(q, where('subject', '==', filters.subject));
    }
    
    return onSnapshot(q, (snapshot) => {
      const quizzes = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        quizzes.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        });
      });
      
      callback(quizzes);
    });
    
  } catch (error) {
    console.error('❌ Failed to setup quiz listener:', error);
    return () => {}; // Return empty unsubscribe function
  }
}

// Listen to leaderboard updates
export function listenToLeaderboard(callback, options = {}) {
  try {
    let q = query(
      collection(db, COLLECTIONS.ATTEMPTS),
      orderBy('percentage', 'desc'),
      limit(options.limit || 50)
    );
    
    return onSnapshot(q, (snapshot) => {
      const leaderboard = [];
      snapshot.forEach((doc, index) => {
        const data = doc.data();
        leaderboard.push({
          id: doc.id,
          rank: index + 1,
          ...data,
          submittedAt: data.submittedAt?.toDate?.() || new Date()
        });
      });
      
      callback(leaderboard);
    });
    
  } catch (error) {
    console.error('❌ Failed to setup leaderboard listener:', error);
    return () => {}; // Return empty unsubscribe function
  }
}

// =====================
// ANALYTICS & STATS
// =====================

// Get dashboard statistics
export async function getDashboardStats() {
  try {
    console.log('📊 Fetching dashboard statistics...');
    
    // This is a simplified version - in production, you might want to 
    // maintain separate analytics collections for better performance
    
    const [quizzesSnap, attemptsSnap, usersSnap] = await Promise.all([
      getDocs(query(collection(db, COLLECTIONS.QUIZZES), where('status', '==', 'active'))),
      getDocs(collection(db, COLLECTIONS.ATTEMPTS)),
      getDocs(collection(db, COLLECTIONS.USERS))
    ]);
    
    const stats = {
      totalQuizzes: quizzesSnap.size,
      totalAttempts: attemptsSnap.size,
      totalUsers: usersSnap.size,
      totalQuestions: 0
    };
    
    // Calculate total questions
    quizzesSnap.forEach((doc) => {
      const data = doc.data();
      stats.totalQuestions += data.totalQuestions || 0;
    });
    
    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let todayAttempts = 0;
    attemptsSnap.forEach((doc) => {
      const data = doc.data();
      const attemptDate = data.submittedAt?.toDate?.() || new Date(0);
      if (attemptDate >= today) {
        todayAttempts++;
      }
    });
    
    stats.todayAttempts = todayAttempts;
    
    console.log('✅ Dashboard stats loaded:', stats);
    return stats;
    
  } catch (error) {
    console.error('❌ Failed to fetch dashboard stats:', error);
    throw error;
  }
}

// =====================
// UTILITY FUNCTIONS
// =====================

// Dispatch quiz events
function dispatchQuizEvent(eventType, data = {}) {
  const event = new CustomEvent(eventType, {
    detail: data,
    bubbles: true
  });
  window.dispatchEvent(event);
}

// Validate quiz data
export function validateQuizData(quizData) {
  const errors = [];
  
  if (!quizData.subject) errors.push('Subject is required');
  if (!quizData.date) errors.push('Date is required');
  if (!quizData.questions || !Array.isArray(quizData.questions)) {
    errors.push('Questions must be an array');
  } else if (quizData.questions.length === 0) {
    errors.push('At least one question is required');
  }
  
  // Validate each question
  quizData.questions?.forEach((q, index) => {
    if (!q.question) errors.push(`Question ${index + 1}: Question text is required`);
    if (!q.options || q.options.length !== 4) {
      errors.push(`Question ${index + 1}: Must have exactly 4 options`);
    }
    if (q.correctAnswer === undefined || q.correctAnswer < 0 || q.correctAnswer > 3) {
      errors.push(`Question ${index + 1}: Valid correct answer index required (0-3)`);
    }
    if (!q.explanation) errors.push(`Question ${index + 1}: Explanation is required`);
  });
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// Calculate quiz score
export function calculateQuizScore(questions, userAnswers) {
  if (!questions || !userAnswers) return 0;
  
  let correctCount = 0;
  questions.forEach((question, index) => {
    if (userAnswers[index] === question.correctAnswer) {
      correctCount++;
    }
  });
  
  return {
    score: correctCount,
    totalQuestions: questions.length,
    percentage: Math.round((correctCount / questions.length) * 100)
  };
}

console.log('🔥 Firebase Quiz service loaded');
