// src/pages/AssessmentTake.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, getDoc, updateDoc, collection, addDoc, 
  query, where, getDocs, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import ProctoringSetup from '../components/assessments/ProctoringSetup';
import AssessmentQuestions from '../components/assessments/AssessmentQuestions';
import ProctoringSystem from '../components/assessments/ProctoringSystem';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  Target,
  BarChart3,
  Zap,
  ChevronLeft,
  Eye,
  Shield,
  Send
} from 'lucide-react';

export default function AssessmentTake() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [assessment, setAssessment] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [proctoringGranted, setProctoringGranted] = useState(false);
  const [proctoringConfig, setProctoringConfig] = useState({});
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [timer, setTimer] = useState(null);
  const [violations, setViolations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (!id || id === 'undefined') {
      setError('Invalid assessment ID');
      setLoading(false);
      return;
    }

    loadAssessmentData();
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [id, user]);

  const loadAssessmentData = async () => {
    try {
      setLoading(true);
      
      // 1. Get assessment data
      const assessmentDoc = await getDoc(doc(db, 'assessments', id));
      if (!assessmentDoc.exists()) {
        setError('Assessment not found. It may have been deleted.');
        setLoading(false);
        return;
      }

      const assessmentData = { id: assessmentDoc.id, ...assessmentDoc.data() };
      setAssessment(assessmentData);
      setProctoringConfig(assessmentData.proctoring || {});

      // 2. Get or create assignment
      if (user) {
        await handleAssignment(assessmentData);
      }
      
    } catch (err) {
      console.error('Error loading assessment:', err);
      setError('Failed to load assessment: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignment = async (assessmentData) => {
    try {
      const assignmentsRef = collection(db, 'assignments');
      const assignmentQuery = query(
        assignmentsRef,
        where('assessmentId', '==', id),
        where('candidateId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(assignmentQuery);
      let assignmentData;

      if (querySnapshot.empty) {
        // Create new assignment
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + (assessmentData.timeLimit || 30));
        
        const assignmentRef = await addDoc(collection(db, 'assignments'), {
          assessmentId: id,
          candidateId: user.uid,
          candidateEmail: user.email,
          candidateName: user.displayName || user.email,
          status: 'in-progress',
          startedAt: serverTimestamp(),
          expiresAt: expiresAt,
          createdAt: serverTimestamp(),
          assessmentTitle: assessmentData.title,
          assessmentDescription: assessmentData.description,
          jobRole: assessmentData.jobRole
        });

        // Get the newly created assignment
        const newAssignmentDoc = await getDoc(assignmentRef);
        assignmentData = { id: newAssignmentDoc.id, ...newAssignmentDoc.data() };

        // Update assessment assignments count
        await updateDoc(doc(db, 'assessments', id), {
          assignments: (assessmentData.assignments || 0) + 1
        });
      } else {
        assignmentData = { 
          id: querySnapshot.docs[0].id, 
          ...querySnapshot.docs[0].data() 
        };

        // Update status if it's still assigned
        if (assignmentData.status === 'assigned') {
          await updateDoc(doc(db, 'assignments', assignmentData.id), {
            status: 'in-progress',
            startedAt: serverTimestamp()
          });
          assignmentData.status = 'in-progress';
        }
      }
      
      setAssignment(assignmentData);

      // 3. Calculate time left
      if (assignmentData.expiresAt) {
        const expiresAt = assignmentData.expiresAt.toDate();
        const timeLeftMs = Math.max(0, expiresAt - new Date());
        setTimeLeft(Math.floor(timeLeftMs / 1000));

        // Start timer
        const timerInterval = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timerInterval);
              handleAutoSubmit();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        setTimer(timerInterval);
      }

    } catch (err) {
      console.error('Error handling assignment:', err);
      setError('Failed to initialize assessment: ' + err.message);
    }
  };

  const handleProctoringGranted = () => {
    setProctoringGranted(true);
  };

  const handleProctoringViolation = (violation) => {
    setViolations(prev => [...prev, violation]);
    
    if (violation.severity === 'high') {
      // Show a more elegant notification instead of alert
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg z-50 max-w-sm';
      notification.innerHTML = `
        <div class="flex items-start">
          <AlertCircle class="text-red-600 mr-3 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h4 class="font-medium text-red-800">Proctoring Violation</h4>
            <p class="text-red-700 text-sm mt-1">${violation.message}</p>
          </div>
        </div>
      `;
      document.body.appendChild(notification);
      
      // Auto remove after 5 seconds
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 5000);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    // Auto-save answers periodically
    debouncedSaveAnswers(questionId, answer);
  };

  // Debounced function to save answers
  const debouncedSaveAnswers = useRef(
    debounce(async (questionId, answer) => {
      if (assignment?.id) {
        try {
          await updateDoc(doc(db, 'assignments', assignment.id), {
            [`answers.${questionId}`]: answer,
            lastSaved: serverTimestamp()
          });
        } catch (error) {
          console.error('Error auto-saving answer:', error);
        }
      }
    }, 2000)
  ).current;

  const handleAutoSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      await submitAssessment();
      // Show time up notification
      const notification = document.createElement('div');
      notification.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50';
      notification.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-md mx-4">
          <div class="text-center">
            <Clock class="text-gray-600 mx-auto mb-4" size={40} />
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Time's Up!</h3>
            <p class="text-gray-600 mb-4">Your assessment has been automatically submitted.</p>
            <button onclick="this.closest('.fixed').remove()" class="bg-black text-white px-6 py-2 rounded-xl hover:bg-gray-800 transition-colors">
              Continue
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(notification);
    } catch (error) {
      console.error('Error auto-submitting:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmModal(false);
    
    try {
      await submitAssessment();
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg z-50 max-w-sm';
      notification.innerHTML = `
        <div class="flex items-start">
          <CheckCircle class="text-green-600 mr-3 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h4 class="font-medium text-green-800">Assessment Submitted</h4>
            <p class="text-green-700 text-sm mt-1">Your assessment was submitted successfully!</p>
          </div>
        </div>
      `;
      document.body.appendChild(notification);
      
      // Auto remove after 5 seconds
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 5000);
      
      // Navigate after a brief delay
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      // Show error notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg z-50 max-w-sm';
      notification.innerHTML = `
        <div class="flex items-start">
          <AlertCircle class="text-red-600 mr-3 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h4 class="font-medium text-red-800">Submission Failed</h4>
            <p class="text-red-700 text-sm mt-1">Failed to submit assessment. Please try again.</p>
          </div>
        </div>
      `;
      document.body.appendChild(notification);
      
      // Auto remove after 5 seconds
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitAssessment = async () => {
    if (!assessment || !assignment) return;

    // Calculate score
    let score = 0;
    const totalQuestions = assessment.questions?.length || 0;
    
    if (totalQuestions > 0) {
      assessment.questions.forEach(question => {
        if (question.correctAnswer === answers[question.id]) {
          score += 1;
        }
      });
    }

    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
    const passed = percentage >= (assessment.passingScore || 70);

    // Update assignment
    await updateDoc(doc(db, 'assignments', assignment.id), {
      status: 'completed',
      completedAt: serverTimestamp(),
      answers,
      score: percentage,
      passed,
      violations: violations.length,
      timeSpent: (assessment.timeLimit || 30) - Math.floor(timeLeft / 60),
      finalAnswers: answers
    });

    // Update assessment submissions count
    await updateDoc(doc(db, 'assessments', assessment.id), {
      submissions: (assessment.submissions || 0) + 1
    });
  };

  // Debounce utility function
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <LoadingSpinner fullScreen={true} text="Loading assessment..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto bg-red-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <AlertCircle className="text-red-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors w-full"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!proctoringGranted && Object.values(proctoringConfig).some(v => v)) {
    return (
      <ProctoringSetup 
        config={proctoringConfig}
        onGranted={handleProctoringGranted}
        assessmentTitle={assessment.title}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft size={20} className="mr-1" />
              Back to Dashboard
            </button>
            
            <div className="flex items-center">
              <div className={`flex items-center px-4 py-2 rounded-xl mr-4 ${
                timeLeft < 300 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
              }`}>
                <Clock size={18} className="mr-2" />
                <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
              </div>
              
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                <span className="text-sm text-gray-600">Proctoring Active</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Proctoring system */}
        {proctoringGranted && assessment && assignment && (
          <ProctoringSystem
            assignmentId={assignment.id}
            config={proctoringConfig}
            onViolation={handleProctoringViolation}
          />
        )}
        
        {/* Assessment header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{assessment.title}</h1>
              <p className="text-gray-600">{assessment.description}</p>
            </div>
            
            <div className="flex-shrink-0">
              <div className="bg-gray-900 text-white px-4 py-2 rounded-lg text-center">
                <div className="text-sm font-medium mb-1">TIME REMAINING</div>
                <div className={`text-xl font-mono font-bold ${timeLeft < 300 ? 'text-red-300' : ''}`}>
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>
          </div>

          {/* Assessment info grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
              <BarChart3 size={20} className="text-gray-600 mb-2" />
              <span className="text-sm text-gray-600">Questions</span>
              <span className="font-semibold text-gray-900">{assessment.questions?.length || 0}</span>
            </div>
            
            <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
              <Clock size={20} className="text-gray-600 mb-2" />
              <span className="text-sm text-gray-600">Duration</span>
              <span className="font-semibold text-gray-900">{assessment.timeLimit || 30}m</span>
            </div>
            
            <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
              <Target size={20} className="text-gray-600 mb-2" />
              <span className="text-sm text-gray-600">To Pass</span>
              <span className="font-semibold text-gray-900">{assessment.passingScore || 70}%</span>
            </div>
            
            <div className="flex flex-col items-center p-3 bg-gray-50 rounded-xl">
              <Zap size={20} className="text-gray-600 mb-2" />
              <span className="text-sm text-gray-600">Level</span>
              <span className="font-semibold text-gray-900 capitalize">{assessment.difficulty || 'Intermediate'}</span>
            </div>
          </div>
        </div>

        {/* Violation warning */}
        {violations.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="text-yellow-600 mr-3 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <h3 className="text-yellow-800 font-medium">Proctoring Alert</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  {violations.length} violation{violations.length !== 1 ? 's' : ''} detected. 
                  Please follow assessment guidelines to avoid further issues.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Questions */}
        <AssessmentQuestions 
          questions={assessment.questions || []}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          timeLimit={assessment.timeLimit}
        />
        
        {/* Submit section */}
        <div className="mt-8 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <div className="flex items-center text-sm text-gray-600">
                <Eye size={16} className="mr-2" />
                <span>
                  {Object.keys(answers).length} of {assessment.questions?.length || 0} questions answered
                </span>
              </div>
              
              {violations.length > 0 && (
                <div className="flex items-center text-sm text-yellow-600 ml-4">
                  <Shield size={16} className="mr-2" />
                  <span>{violations.length} violation{violations.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Send size={18} className="mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="mx-auto bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Send className="text-blue-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Submit Assessment</h3>
              <p className="text-gray-600">
                Are you sure you want to submit your assessment? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                className="flex-1 px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}