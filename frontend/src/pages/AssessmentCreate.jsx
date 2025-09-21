import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, setDoc, collection, addDoc, getDoc, updateDoc} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { generateAssessmentWithAI, testBackendConnection } from '../services/groqApi';
import { 
  FileText, Settings, Zap, Save, ArrowLeft, 
  AlertCircle, CheckCircle, Loader, WifiOff,
  Sparkles, Brain, Target, Clock, Users,
  Edit3, Plus, Trash2, Copy, Eye,
  ChevronRight, Info, AlertTriangle, X,
  Download, Send, BarChart3
} from 'lucide-react';

// Mock LoadingSpinner component
const LoadingSpinner = ({ fullScreen }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-black"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-black opacity-20"></div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl font-semibold text-black animate-pulse">Processing Assessment</p>
            <p className="text-gray-600">Please wait while we generate your assessment...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent"></div>
    </div>
  );
};

// Assessment Preview Modal Component
const AssessmentPreview = ({ assessment, onClose, onSave, onFinalizeAndAssign, loading }) => {
  if (!assessment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-black">Assessment Preview</h2>
            <p className="text-gray-600 text-sm mt-1">Review your AI-generated assessment</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onSave}
              disabled={loading}
              className="flex items-center px-4 py-2 border-2 border-black text-black rounded-xl hover:bg-black hover:text-white transition-all duration-200 disabled:opacity-50"
            >
              <Save size={16} className="mr-2" />
              Save Draft
            </button>
            <button
              onClick={onFinalizeAndAssign}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
            >
              <Send size={16} className="mr-2" />
              Finalize & Assign
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-colors duration-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="p-8 space-y-8">
            {/* Assessment Overview */}
            <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-black mb-4">Assessment Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-black mb-2">Basic Information</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Title:</span> {assessment.title}</p>
                    <p><span className="font-medium">Type:</span> {assessment.type}</p>
                    <p><span className="font-medium">Time Limit:</span> {assessment.timeLimit} minutes</p>
                    <p><span className="font-medium">Passing Score:</span> {assessment.passingScore}%</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-2">Assessment Details</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Questions:</span> {assessment.questions?.length || 0}</p>
                    <p><span className="font-medium">Job Role:</span> {assessment.jobRole}</p>
                    <p><span className="font-medium">Difficulty:</span> {assessment.difficulty}</p>
                    <p><span className="font-medium">Category:</span> {assessment.category}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <p><span className="font-medium">Description:</span> {assessment.description}</p>
              </div>
            </div>

            {/* Questions Preview */}
            <div>
              <h3 className="text-xl font-bold text-black mb-6">Questions ({assessment.questions?.length || 0})</h3>
              <div className="space-y-6">
                {assessment.questions?.map((question, index) => (
                  <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <span className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                          {index + 1}
                        </span>
                        <h4 className="font-semibold text-black text-lg">{question.question}</h4>
                      </div>
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                        {question.type || 'Multiple Choice'}
                      </span>
                    </div>
                    
                    {question.options && (
                      <div className="ml-11 space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className={`p-3 rounded-lg border ${
                            option === question.correctAnswer 
                              ? 'border-green-500 bg-green-50 text-green-800' 
                              : 'border-gray-200 bg-gray-50'
                          }`}>
                            <span className="font-medium mr-2">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            {option}
                            {option === question.correctAnswer && (
                              <span className="ml-2 text-green-600 font-medium">(Correct Answer)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {question.explanation && (
                      <div className="ml-11 mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">Explanation:</span> {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mock AssessmentForm component with enhanced features
const AssessmentForm = ({ onGenerateWithAI, onSave, onFinalizeAndAssign, loading, aiEnabled, initialData }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    jobRole: '',
    type: 'multiple_choice',
    timeLimit: 30,
    difficulty: 'medium',
    numberOfQuestions: 10,
    passingScore: 70,
    ...initialData
  });

  const isFormValid = formData.title && formData.jobRole && formData.description;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h3 className="text-xl font-bold text-black mb-6">Assessment Configuration</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="e.g., Frontend Developer Assessment"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Job Role *</label>
          <input
            type="text"
            value={formData.jobRole}
            onChange={(e) => setFormData({...formData, jobRole: e.target.value})}
            placeholder="e.g., Frontend Developer"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
          >
            <option value="multiple_choice">Multiple Choice</option>
            <option value="coding">Coding Challenge</option>
            <option value="text">Text Response</option>
            <option value="mixed">Mixed Format</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (minutes)</label>
          <input
            type="number"
            value={formData.timeLimit}
            onChange={(e) => setFormData({...formData, timeLimit: parseInt(e.target.value)})}
            min="5"
            max="180"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
          >
            <option value="beginner">Beginner</option>
            <option value="medium">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
          <input
            type="number"
            value={formData.numberOfQuestions}
            onChange={(e) => setFormData({...formData, numberOfQuestions: parseInt(e.target.value)})}
            min="1"
            max="50"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Passing Score (%)</label>
          <input
            type="number"
            value={formData.passingScore}
            onChange={(e) => setFormData({...formData, passingScore: parseInt(e.target.value)})}
            min="0"
            max="100"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
          />
        </div>
      </div>
      
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Provide a detailed description of what this assessment evaluates..."
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
        />
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* AI Generation Button */}
        <button 
          onClick={() => onGenerateWithAI && onGenerateWithAI(formData)}
          disabled={loading || !aiEnabled || !isFormValid}
          className="flex items-center justify-center px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 flex-1"
        >
          <Sparkles size={18} className="mr-3" />
          {loading ? 'Generating...' : 'Generate with AI'}
        </button>
        
        {/* Save Draft Button */}
        <button 
          onClick={() => onSave && onSave(formData)}
          disabled={loading || !isFormValid}
          className="flex items-center justify-center px-8 py-4 border-2 border-black text-black rounded-xl hover:bg-black hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
        >
          <Save size={18} className="mr-3" />
          Save as Draft
        </button>
        
        {/* Finalize and Assign Button */}
        <button 
          onClick={() => onFinalizeAndAssign && onFinalizeAndAssign(formData)}
          disabled={loading || !isFormValid}
          className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 flex-1"
        >
          <Send size={18} className="mr-3" />
          Finalize & Assign
        </button>
      </div>
      
      {/* Form Validation Messages */}
      {!isFormValid && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-start space-x-2">
            <AlertTriangle size={16} className="text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Please complete required fields:</p>
              <ul className="list-disc list-inside space-y-1">
                {!formData.title && <li>Assessment Title</li>}
                {!formData.jobRole && <li>Job Role</li>}
                {!formData.description && <li>Description</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function AssessmentCreate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendConnected, setBackendConnected] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [showConnectionWarning, setShowConnectionWarning] = useState(true);
  const [saveProgress, setSaveProgress] = useState(0);
  const [generatedAssessment, setGeneratedAssessment] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); // Get assessment ID from URL if editing

  useEffect(() => {
    // Test backend connection on component mount
    testBackendConnection().then(connected => {
      setBackendConnected(connected);
      if (!connected) {
        setError('Backend server is not connected. Using fallback assessment generation.');
      }
    });

    // If we're editing an existing assessment, load it
    if (id && id !== 'create') {
      loadAssessmentForEditing(id);
    }
  }, [id]);

  const loadAssessmentForEditing = async (assessmentId) => {
    try {
      setLoading(true);
      const assessmentDoc = await getDoc(doc(db, 'assessments', assessmentId));
      if (assessmentDoc.exists()) {
        setEditingAssessment({ id: assessmentDoc.id, ...assessmentDoc.data() });
      } else {
        setError('Assessment not found');
      }
    } catch (err) {
      setError('Failed to load assessment: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWithAI = async (formData) => {
    setLoading(true);
    setError('');
    setSaveProgress(0);
    
    try {
      // Simulate AI generation progress
      for (let i = 0; i <= 75; i += 15) {
        setSaveProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Call the backend API to generate assessment
      const generatedAssessment = await generateAssessmentWithAI(formData);
      
      setSaveProgress(90);
      
      // Store the generated assessment for preview
      setGeneratedAssessment(generatedAssessment);
      setShowPreview(true);
      
      setSaveProgress(100);
      
      // If we're editing, update the existing assessment
      if (editingAssessment) {
        await updateDoc(doc(db, 'assessments', editingAssessment.id), {
          ...generatedAssessment,
          updatedAt: new Date()
        });
        setEditingAssessment(prev => ({ ...prev, ...generatedAssessment }));
      }
      
      // Reset progress after a brief delay
      setTimeout(() => setSaveProgress(0), 1000);
    } catch (err) {
      console.error('Error generating assessment:', err);
      setError(err.message || 'Failed to generate assessment');
      setSaveProgress(0);
    }
    
    setLoading(false);
  };

  const handleSaveAssessment = async (assessmentData) => {
    setLoading(true);
    setError('');
    setSaveProgress(0);
    
    try {
      // Simulate save progress
      for (let i = 0; i <= 75; i += 25) {
        setSaveProgress(i);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      let savedAssessment;
      
      // If we're editing, update the existing assessment
      if (editingAssessment) {
        await updateDoc(doc(db, 'assessments', editingAssessment.id), {
          ...assessmentData,
          updatedAt: new Date()
        });
        savedAssessment = { ...editingAssessment, ...assessmentData };
        setSaveProgress(100);
      } else {
        // Create a new assessment
        const docRef = await addDoc(collection(db, 'assessments'), {
          ...assessmentData,
          createdBy: user.uid,
          createdAt: new Date(),
          assignments: 0,
          submissions: 0,
          status: 'draft'
        });
        savedAssessment = { id: docRef.id, ...assessmentData };
        setSaveProgress(100);
      }
      
      // Update the editing assessment state
      setEditingAssessment(savedAssessment);
      
      // Show success message
      setError('');
      alert('Assessment saved successfully!');
      
      // Reset progress after brief delay
      setTimeout(() => setSaveProgress(0), 1000);
    } catch (err) {
      console.error('Error saving assessment:', err);
      setError(err.message || 'Failed to save assessment');
      setSaveProgress(0);
    }
    
    setLoading(false);
  };

  const handleFinalizeAndAssign = async (assessmentData) => {
    setLoading(true);
    setError('');
    setSaveProgress(0);
    
    try {
      // First save/update the assessment
      let finalizedAssessment;
      
      for (let i = 0; i <= 50; i += 12) {
        setSaveProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      if (editingAssessment) {
        await updateDoc(doc(db, 'assessments', editingAssessment.id), {
          ...assessmentData,
          status: 'active',
          finalizedAt: new Date(),
          updatedAt: new Date()
        });
        finalizedAssessment = { ...editingAssessment, ...assessmentData, status: 'active' };
      } else {
        const docRef = await addDoc(collection(db, 'assessments'), {
          ...assessmentData,
          createdBy: user.uid,
          createdAt: new Date(),
          finalizedAt: new Date(),
          assignments: 0,
          submissions: 0,
          status: 'active'
        });
        finalizedAssessment = { id: docRef.id, ...assessmentData, status: 'active' };
      }
      
      setSaveProgress(75);
      
      // Update state
      setEditingAssessment(finalizedAssessment);
      
      setSaveProgress(100);
      
      // Show success and navigate to assignment page
      alert('Assessment finalized successfully! Redirecting to candidate assignment page...');
      
      setTimeout(() => {
        setSaveProgress(0);
        navigate(`/assessment/assign/${finalizedAssessment.id}`);
      }, 1000);
      
    } catch (err) {
      console.error('Error finalizing assessment:', err);
      setError(err.message || 'Failed to finalize assessment');
      setSaveProgress(0);
    }
    
    setLoading(false);
  };

  const handleSaveGeneratedAssessment = () => {
    if (generatedAssessment) {
      setShowPreview(false);
      handleSaveAssessment(generatedAssessment);
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  if (loading && !editingAssessment && saveProgress === 0) {
    return <LoadingSpinner fullScreen={true} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoBack}
                className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <ArrowLeft size={20} />
              </button>
              
              <div>
                <h1 className="text-3xl font-bold text-black">
                  {editingAssessment ? 'Edit Assessment' : 'Create New Assessment'}
                </h1>
                <div className="flex items-center mt-2 space-x-4">
                  <p className="text-gray-600">
                    {editingAssessment 
                      ? 'Modify your existing assessment configuration' 
                      : 'Build a customized evaluation with AI assistance'
                    }
                  </p>
                  
                  {/* Connection Status */}
                  <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    backendConnected 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {backendConnected ? (
                      <>
                        <CheckCircle size={12} className="mr-1" />
                        AI Connected
                      </>
                    ) : (
                      <>
                        <WifiOff size={12} className="mr-1" />
                        AI Offline
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {generatedAssessment && (
                <button 
                  onClick={() => setShowPreview(true)}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200"
                >
                  <Eye size={16} className="mr-2" />
                  Preview
                </button>
              )}
              
              <button 
                onClick={() => handleSaveAssessment(editingAssessment || {})}
                disabled={loading}
                className="flex items-center px-4 py-2 border-2 border-black text-black rounded-xl hover:bg-black hover:text-white transition-all duration-200 disabled:opacity-50"
              >
                <Save size={16} className="mr-2" />
                Save Draft
              </button>

              <button 
                onClick={() => handleFinalizeAndAssign(editingAssessment || {})}
                disabled={loading}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
              >
                <Send size={16} className="mr-2" />
                Finalize & Assign
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        {loading && saveProgress > 0 && (
          <div className="mb-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-black flex items-center">
                <Loader className="animate-spin mr-2" size={16} />
                {saveProgress < 100 ? 'Generating Assessment...' : 'Finalizing...'}
              </h3>
              <span className="text-sm text-gray-600">{saveProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-black h-2 rounded-full transition-all duration-300" 
                style={{ width: `${saveProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Connection Warning */}
        {!backendConnected && showConnectionWarning && (
          <div className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="text-yellow-600 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-2">AI Assistant Unavailable</h3>
                  <p className="text-yellow-700 text-sm mb-4">
                    The AI generation service is currently offline. You can still create assessments manually, 
                    or try the AI features again later when the connection is restored.
                  </p>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => testBackendConnection().then(setBackendConnected)}
                      className="text-xs text-yellow-800 underline hover:no-underline"
                    >
                      Retry Connection
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowConnectionWarning(false)}
                className="text-yellow-600 hover:text-yellow-800 p-1"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-8 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <AlertCircle className="text-red-600 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold text-red-800 mb-2">Error Encountered</h3>
                  <p className="text-red-700 text-sm mb-4">{error}</p>
                </div>
              </div>
              <button 
                onClick={() => setError('')}
                className="text-red-600 hover:text-red-800 p-1"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Assessment Overview for Editing */}
        {editingAssessment && (
          <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 mb-8 border border-gray-100">
            <h3 className="font-semibold text-black mb-4 flex items-center">
              <Info size={16} className="mr-2" />
              Current Assessment Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-black mb-1">12</div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-black mb-1">45m</div>
                <div className="text-sm text-gray-600">Time Limit</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-black mb-1">25</div>
                <div className="text-sm text-gray-600">Assignments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-black mb-1">18</div>
                <div className="text-sm text-gray-600">Submissions</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Form Component */}
        <AssessmentForm 
          onGenerateWithAI={handleGenerateWithAI}
          onSave={handleSaveAssessment}
          onFinalizeAndAssign={handleFinalizeAndAssign}
          loading={loading}
          aiEnabled={backendConnected}
          initialData={editingAssessment}
        />
      </div>

      {/* Assessment Preview Modal */}
      {showPreview && (
        <AssessmentPreview 
          assessment={generatedAssessment}
          onClose={() => setShowPreview(false)}
          onSave={handleSaveGeneratedAssessment}
          onFinalizeAndAssign={() => {
            setShowPreview(false);
            handleFinalizeAndAssign(generatedAssessment);
          }}
          loading={loading}
        />
      )}
    </div>
  );
}
















// import { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { doc, setDoc, collection, addDoc, getDoc, updateDoc} from 'firebase/firestore';
// import { db } from '../services/firebase';
// import { useAuth } from '../hooks/useAuth';
// import { generateAssessmentWithAI, testBackendConnection } from '../services/groqApi';
// import { 
//   FileText, Settings, Zap, Save, ArrowLeft, 
//   AlertCircle, CheckCircle, Loader, WifiOff,
//   Sparkles, Brain, Target, Clock, Users,
//   Edit3, Plus, Trash2, Copy, Eye,
//   ChevronRight, Info, AlertTriangle, X,
//   Download, Send, BarChart3
// } from 'lucide-react';
// import ProctoringSystem from '../components/assessments/ProctoringSystem';

// // In your AssessmentForm component, add proctoring options
// const [proctoringConfig, setProctoringConfig] = useState({
//   camera: false,
//   screen: false,
//   microphone: false,
//   browserLock: false
// });

// const updateAssessmentViolations = async (assessmentId, violation) => {
//   try {
//     const assessmentRef = doc(db, 'assignments', assessmentId);
//     await updateDoc(assessmentRef, {
//       violations: arrayUnion(violation),
//       lastViolation: new Date()
//     });
//   } catch (error) {
//     console.error('Failed to update assessment violations:', error);
//   }
// };

// // Mock LoadingSpinner component
// const LoadingSpinner = ({ fullScreen }) => {
//   if (fullScreen) {
//     return (
//       <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
//         <div className="flex flex-col items-center space-y-6">
//           <div className="relative">
//             <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-black"></div>
//             <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-black opacity-20"></div>
//           </div>
//           <div className="text-center space-y-2">
//             <p className="text-xl font-semibold text-black animate-pulse">Processing Assessment</p>
//             <p className="text-gray-600">Please wait while we generate your assessment...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }
  
//   return (
//     <div className="flex items-center justify-center py-8">
//       <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent"></div>
//     </div>
//   );
// };

// // Assessment Preview Modal Component
// const AssessmentPreview = ({ assessment, onClose, onSave, onFinalizeAndAssign, loading }) => {
//   if (!assessment) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
//         {/* Modal Header */}
//         <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
//           <div>
//             <h2 className="text-2xl font-bold text-black">Assessment Preview</h2>
//             <p className="text-gray-600 text-sm mt-1">Review your AI-generated assessment</p>
//           </div>
//           <div className="flex items-center space-x-3">
//             <button
//               onClick={onSave}
//               disabled={loading}
//               className="flex items-center px-4 py-2 border-2 border-black text-black rounded-xl hover:bg-black hover:text-white transition-all duration-200 disabled:opacity-50"
//             >
//               <Save size={16} className="mr-2" />
//               Save Draft
//             </button>
//             <button
//               onClick={onFinalizeAndAssign}
//               disabled={loading}
//               className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
//             >
//               <Send size={16} className="mr-2" />
//               Finalize & Assign
//             </button>
//             <button
//               onClick={onClose}
//               className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-colors duration-200"
//             >
//               <X size={20} />
//             </button>
//           </div>
//         </div>

//         {/* Modal Content */}
//         <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
//           <div className="p-8 space-y-8">
//             {/* Assessment Overview */}
//             <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border border-gray-100">
//               <h3 className="text-xl font-bold text-black mb-4">Assessment Overview</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <h4 className="font-semibold text-black mb-2">Basic Information</h4>
//                   <div className="space-y-2">
//                     <p><span className="font-medium">Title:</span> {assessment.title}</p>
//                     <p><span className="font-medium">Type:</span> {assessment.type}</p>
//                     <p><span className="font-medium">Time Limit:</span> {assessment.timeLimit} minutes</p>
//                     <p><span className="font-medium">Passing Score:</span> {assessment.passingScore}%</p>
//                   </div>
//                 </div>
//                 <div>
//                   <h4 className="font-semibold text-black mb-2">Assessment Details</h4>
//                   <div className="space-y-2">
//                     <p><span className="font-medium">Questions:</span> {assessment.questions?.length || 0}</p>
//                     <p><span className="font-medium">Job Role:</span> {assessment.jobRole}</p>
//                     <p><span className="font-medium">Difficulty:</span> {assessment.difficulty}</p>
//                     <p><span className="font-medium">Category:</span> {assessment.category}</p>
//                   </div>
//                 </div>
//               </div>
//               <div className="mt-4">
//                 <p><span className="font-medium">Description:</span> {assessment.description}</p>
//               </div>
//             </div>

//             {/* Questions Preview */}
//             <div>
//               <h3 className="text-xl font-bold text-black mb-6">Questions ({assessment.questions?.length || 0})</h3>
//               <div className="space-y-6">
//                 {assessment.questions?.map((question, index) => (
//                   <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200">
//                     <div className="flex items-start justify-between mb-4">
//                       <div className="flex items-center">
//                         <span className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
//                           {index + 1}
//                         </span>
//                         <h4 className="font-semibold text-black text-lg">{question.question}</h4>
//                       </div>
//                       <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
//                         {question.type || 'Multiple Choice'}
//                       </span>
//                     </div>
                    
//                     {question.options && (
//                       <div className="ml-11 space-y-2">
//                         {question.options.map((option, optionIndex) => (
//                           <div key={optionIndex} className={`p-3 rounded-lg border ${
//                             option === question.correctAnswer 
//                               ? 'border-green-500 bg-green-50 text-green-800' 
//                               : 'border-gray-200 bg-gray-50'
//                           }`}>
//                             <span className="font-medium mr-2">
//                               {String.fromCharCode(65 + optionIndex)}.
//                             </span>
//                             {option}
//                             {option === question.correctAnswer && (
//                               <span className="ml-2 text-green-600 font-medium">(Correct Answer)</span>
//                             )}
//                           </div>
//                         ))}
//                       </div>
//                     )}
                    
//                     {question.explanation && (
//                       <div className="ml-11 mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
//                         <p className="text-sm text-blue-800">
//                           <span className="font-medium">Explanation:</span> {question.explanation}
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Mock AssessmentForm component with enhanced features
// const AssessmentForm = ({ onGenerateWithAI, onSave, onFinalizeAndAssign, loading, aiEnabled, initialData }) => {
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     jobRole: '',
//     type: 'multiple_choice',
//     timeLimit: 30,
//     difficulty: 'medium',
//     numberOfQuestions: 10,
//     passingScore: 70,
//     ...initialData
//   });

//   const isFormValid = formData.title && formData.jobRole && formData.description;

//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
//       <h3 className="text-xl font-bold text-black mb-6">Assessment Configuration</h3>
      
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Title *</label>
//           <input
//             type="text"
//             value={formData.title}
//             onChange={(e) => setFormData({...formData, title: e.target.value})}
//             placeholder="e.g., Frontend Developer Assessment"
//             className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
//           />
//         </div>
        
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">Job Role *</label>
//           <input
//             type="text"
//             value={formData.jobRole}
//             onChange={(e) => setFormData({...formData, jobRole: e.target.value})}
//             placeholder="e.g., Frontend Developer"
//             className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
//           />
//         </div>
        
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Type</label>
//           <select
//             value={formData.type}
//             onChange={(e) => setFormData({...formData, type: e.target.value})}
//             className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
//           >
//             <option value="multiple_choice">Multiple Choice</option>
//             <option value="coding">Coding Challenge</option>
//             <option value="text">Text Response</option>
//             <option value="mixed">Mixed Format</option>
//           </select>
//         </div>
        
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (minutes)</label>
//           <input
//             type="number"
//             value={formData.timeLimit}
//             onChange={(e) => setFormData({...formData, timeLimit: parseInt(e.target.value)})}
//             min="5"
//             max="180"
//             className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
//           />
//         </div>
        
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
//           <select
//             value={formData.difficulty}
//             onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
//             className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
//           >
//             <option value="beginner">Beginner</option>
//             <option value="medium">Intermediate</option>
//             <option value="advanced">Advanced</option>
//           </select>
//         </div>
        
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
//           <input
//             type="number"
//             value={formData.numberOfQuestions}
//             onChange={(e) => setFormData({...formData, numberOfQuestions: parseInt(e.target.value)})}
//             min="1"
//             max="50"
//             className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">Passing Score (%)</label>
//           <input
//             type="number"
//             value={formData.passingScore}
//             onChange={(e) => setFormData({...formData, passingScore: parseInt(e.target.value)})}
//             min="0"
//             max="100"
//             className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
//           />
//         </div>
//       </div>
      
//       <div className="mb-8">
//         <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
//         <textarea
//           value={formData.description}
//           onChange={(e) => setFormData({...formData, description: e.target.value})}
//           placeholder="Provide a detailed description of what this assessment evaluates..."
//           rows={4}
//           className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
//         />
//       </div>
      
//       {/* Action Buttons */}
//       <div className="flex flex-col sm:flex-row gap-4">
//         {/* AI Generation Button */}
//         <button 
//           onClick={() => onGenerateWithAI && onGenerateWithAI(formData)}
//           disabled={loading || !aiEnabled || !isFormValid}
//           className="flex items-center justify-center px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 flex-1"
//         >
//           <Sparkles size={18} className="mr-3" />
//           {loading ? 'Generating...' : 'Generate with AI'}
//         </button>
        
//         {/* Save Draft Button */}
//         <button 
//           onClick={() => onSave && onSave(formData)}
//           disabled={loading || !isFormValid}
//           className="flex items-center justify-center px-8 py-4 border-2 border-black text-black rounded-xl hover:bg-black hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
//         >
//           <Save size={18} className="mr-3" />
//           Save as Draft
//         </button>
        
//         {/* Finalize and Assign Button */}
//         <button 
//           onClick={() => onFinalizeAndAssign && onFinalizeAndAssign(formData)}
//           disabled={loading || !isFormValid}
//           className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 flex-1"
//         >
//           <Send size={18} className="mr-3" />
//           Finalize & Assign
//         </button>
//       </div>
      
//       {/* Form Validation Messages */}
//       {!isFormValid && (
//         <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
//           <div className="flex items-start space-x-2">
//             <AlertTriangle size={16} className="text-yellow-600 mt-0.5" />
//             <div className="text-sm text-yellow-800">
//               <p className="font-medium mb-1">Please complete required fields:</p>
//               <ul className="list-disc list-inside space-y-1">
//                 {!formData.title && <li>Assessment Title</li>}
//                 {!formData.jobRole && <li>Job Role</li>}
//                 {!formData.description && <li>Description</li>}
//               </ul>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default function AssessmentCreate() {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [backendConnected, setBackendConnected] = useState(false);
//   const [editingAssessment, setEditingAssessment] = useState(null);
//   const [showConnectionWarning, setShowConnectionWarning] = useState(true);
//   const [saveProgress, setSaveProgress] = useState(0);
//   const [generatedAssessment, setGeneratedAssessment] = useState(null);
//   const [showPreview, setShowPreview] = useState(false);
  
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const { id } = useParams(); // Get assessment ID from URL if editing

//   useEffect(() => {
//     // Test backend connection on component mount
//     testBackendConnection().then(connected => {
//       setBackendConnected(connected);
//       if (!connected) {
//         setError('Backend server is not connected. Using fallback assessment generation.');
//       }
//     });

//     // If we're editing an existing assessment, load it
//     if (id && id !== 'create') {
//       loadAssessmentForEditing(id);
//     }
//   }, [id]);

//   const loadAssessmentForEditing = async (assessmentId) => {
//     try {
//       setLoading(true);
//       const assessmentDoc = await getDoc(doc(db, 'assessments', assessmentId));
//       if (assessmentDoc.exists()) {
//         setEditingAssessment({ id: assessmentDoc.id, ...assessmentDoc.data() });
//       } else {
//         setError('Assessment not found');
//       }
//     } catch (err) {
//       setError('Failed to load assessment: ' + err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleGenerateWithAI = async (formData) => {
//     setLoading(true);
//     setError('');
//     setSaveProgress(0);
    
//     try {
//       // Simulate AI generation progress
//       for (let i = 0; i <= 75; i += 15) {
//         setSaveProgress(i);
//         await new Promise(resolve => setTimeout(resolve, 200));
//       }
      
//       // Call the backend API to generate assessment
//       const generatedAssessment = await generateAssessmentWithAI(formData);
      
//       setSaveProgress(90);
      
//       // Store the generated assessment for preview
//       setGeneratedAssessment(generatedAssessment);
//       setShowPreview(true);
      
//       setSaveProgress(100);
      
//       // If we're editing, update the existing assessment
//       if (editingAssessment) {
//         await updateDoc(doc(db, 'assessments', editingAssessment.id), {
//           ...generatedAssessment,
//           updatedAt: new Date()
//         });
//         setEditingAssessment(prev => ({ ...prev, ...generatedAssessment }));
//       }
      
//       // Reset progress after a brief delay
//       setTimeout(() => setSaveProgress(0), 1000);
//     } catch (err) {
//       console.error('Error generating assessment:', err);
//       setError(err.message || 'Failed to generate assessment');
//       setSaveProgress(0);
//     }
    
//     setLoading(false);
//   };

//   const handleSaveAssessment = async (assessmentData) => {
//     setLoading(true);
//     setError('');
//     setSaveProgress(0);
    
//     try {
//       // Simulate save progress
//       for (let i = 0; i <= 75; i += 25) {
//         setSaveProgress(i);
//         await new Promise(resolve => setTimeout(resolve, 300));
//       }
      
//       let savedAssessment;
      
//       // If we're editing, update the existing assessment
//       if (editingAssessment) {
//         await updateDoc(doc(db, 'assessments', editingAssessment.id), {
//           ...assessmentData,
//           updatedAt: new Date()
//         });
//         savedAssessment = { ...editingAssessment, ...assessmentData };
//         setSaveProgress(100);
//       } else {
//         // Create a new assessment
//         const docRef = await addDoc(collection(db, 'assessments'), {
//           ...assessmentData,
//           createdBy: user.uid,
//           createdAt: new Date(),
//           assignments: 0,
//           submissions: 0,
//           status: 'draft'
//         });
//         savedAssessment = { id: docRef.id, ...assessmentData };
//         setSaveProgress(100);
//       }
      
//       // Update the editing assessment state
//       setEditingAssessment(savedAssessment);
      
//       // Show success message
//       setError('');
//       alert('Assessment saved successfully!');
      
//       // Reset progress after brief delay
//       setTimeout(() => setSaveProgress(0), 1000);
//     } catch (err) {
//       console.error('Error saving assessment:', err);
//       setError(err.message || 'Failed to save assessment');
//       setSaveProgress(0);
//     }
    
//     setLoading(false);
//   };

//   const handleFinalizeAndAssign = async (assessmentData) => {
//     setLoading(true);
//     setError('');
//     setSaveProgress(0);
    
//     try {
//       // First save/update the assessment
//       let finalizedAssessment;
      
//       for (let i = 0; i <= 50; i += 12) {
//         setSaveProgress(i);
//         await new Promise(resolve => setTimeout(resolve, 200));
//       }
      
//       if (editingAssessment) {
//         await updateDoc(doc(db, 'assessments', editingAssessment.id), {
//           ...assessmentData,
//           status: 'active',
//           finalizedAt: new Date(),
//           updatedAt: new Date()
//         });
//         finalizedAssessment = { ...editingAssessment, ...assessmentData, status: 'active' };
//       } else {
//         const docRef = await addDoc(collection(db, 'assessments'), {
//           ...assessmentData,
//           createdBy: user.uid,
//           createdAt: new Date(),
//           finalizedAt: new Date(),
//           assignments: 0,
//           submissions: 0,
//           status: 'active'
//         });
//         finalizedAssessment = { id: docRef.id, ...assessmentData, status: 'active' };
//       }
      
//       setSaveProgress(75);
      
//       // Update state
//       setEditingAssessment(finalizedAssessment);
      
//       setSaveProgress(100);
      
//       // Show success and navigate to assignment page
//       alert('Assessment finalized successfully! Redirecting to candidate assignment page...');
      
//       setTimeout(() => {
//         setSaveProgress(0);
//         navigate(`/assessment/assign/${finalizedAssessment.id}`);
//       }, 1000);
      
//     } catch (err) {
//       console.error('Error finalizing assessment:', err);
//       setError(err.message || 'Failed to finalize assessment');
//       setSaveProgress(0);
//     }
    
//     setLoading(false);
//   };

//   const handleSaveGeneratedAssessment = () => {
//     if (generatedAssessment) {
//       setShowPreview(false);
//       handleSaveAssessment(generatedAssessment);
//     }
//   };

//   const handleGoBack = () => {
//     navigate('/');
//   };

//   if (loading && !editingAssessment && saveProgress === 0) {
//     return <LoadingSpinner fullScreen={true} />;
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Enhanced Header */}
//       <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between py-6">
//             <div className="flex items-center space-x-4">
//               <button
//                 onClick={handleGoBack}
//                 className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-xl transition-all duration-200"
//               >
//                 <ArrowLeft size={20} />
//               </button>
              
//               <div>
//                 <h1 className="text-3xl font-bold text-black">
//                   {editingAssessment ? 'Edit Assessment' : 'Create New Assessment'}
//                 </h1>
//                 <div className="flex items-center mt-2 space-x-4">
//                   <p className="text-gray-600">
//                     {editingAssessment 
//                       ? 'Modify your existing assessment configuration' 
//                       : 'Build a customized evaluation with AI assistance'
//                     }
//                   </p>
                  
//                   {/* Connection Status */}
//                   <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
//                     backendConnected 
//                       ? 'bg-green-100 text-green-800' 
//                       : 'bg-red-100 text-red-800'
//                   }`}>
//                     {backendConnected ? (
//                       <>
//                         <CheckCircle size={12} className="mr-1" />
//                         AI Connected
//                       </>
//                     ) : (
//                       <>
//                         <WifiOff size={12} className="mr-1" />
//                         AI Offline
//                       </>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Action Buttons */}
//             <div className="flex items-center space-x-3">
//               {generatedAssessment && (
//                 <button 
//                   onClick={() => setShowPreview(true)}
//                   className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200"
//                 >
//                   <Eye size={16} className="mr-2" />
//                   Preview
//                 </button>
//               )}
              
//               <button 
//                 onClick={() => handleSaveAssessment(editingAssessment || {})}
//                 disabled={loading}
//                 className="flex items-center px-4 py-2 border-2 border-black text-black rounded-xl hover:bg-black hover:text-white transition-all duration-200 disabled:opacity-50"
//               >
//                 <Save size={16} className="mr-2" />
//                 Save Draft
//               </button>

//               <button 
//                 onClick={() => handleFinalizeAndAssign(editingAssessment || {})}
//                 disabled={loading}
//                 className="flex items-center px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
//               >
//                 <Send size={16} className="mr-2" />
//                 Finalize & Assign
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Progress Bar */}
//         {loading && saveProgress > 0 && (
//           <div className="mb-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="font-semibold text-black flex items-center">
//                 <Loader className="animate-spin mr-2" size={16} />
//                 {saveProgress < 100 ? 'Generating Assessment...' : 'Finalizing...'}
//               </h3>
//               <span className="text-sm text-gray-600">{saveProgress}%</span>
//             </div>
//             <div className="w-full bg-gray-200 rounded-full h-2">
//               <div 
//                 className="bg-black h-2 rounded-full transition-all duration-300" 
//                 style={{ width: `${saveProgress}%` }}
//               ></div>
//             </div>
//           </div>
//         )}

//         {/* Connection Warning */}
//         {!backendConnected && showConnectionWarning && (
//           <div className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6">
//             <div className="flex items-start justify-between">
//               <div className="flex items-start space-x-3">
//                 <AlertTriangle className="text-yellow-600 mt-1" size={20} />
//                 <div>
//                   <h3 className="font-semibold text-yellow-800 mb-2">AI Assistant Unavailable</h3>
//                   <p className="text-yellow-700 text-sm mb-4">
//                     The AI generation service is currently offline. You can still create assessments manually, 
//                     or try the AI features again later when the connection is restored.
//                   </p>
//                   <div className="flex items-center space-x-3">
//                     <button 
//                       onClick={() => testBackendConnection().then(setBackendConnected)}
//                       className="text-xs text-yellow-800 underline hover:no-underline"
//                     >
//                       Retry Connection
//                     </button>
//                   </div>
//                 </div>
//               </div>
//               <button
//                 onClick={() => setShowConnectionWarning(false)}
//                 className="text-yellow-600 hover:text-yellow-800 p-1"
//               >
//                 <X size={16} />
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Error Display */}
//         {error && (
//           <div className="mb-8 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6">
//             <div className="flex items-start justify-between">
//               <div className="flex items-start space-x-3">
//                 <AlertCircle className="text-red-600 mt-1" size={20} />
//                 <div>
//                   <h3 className="font-semibold text-red-800 mb-2">Error Encountered</h3>
//                   <p className="text-red-700 text-sm mb-4">{error}</p>
//                 </div>
//               </div>
//               <button 
//                 onClick={() => setError('')}
//                 className="text-red-600 hover:text-red-800 p-1"
//               >
//                 <X size={16} />
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Assessment Overview for Editing */}
//         {editingAssessment && (
//           <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 mb-8 border border-gray-100">
//             <h3 className="font-semibold text-black mb-4 flex items-center">
//               <Info size={16} className="mr-2" />
//               Current Assessment Overview
//             </h3>
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//               <div className="text-center">
//                 <div className="text-2xl font-bold text-black mb-1">12</div>
//                 <div className="text-sm text-gray-600">Questions</div>
//               </div>
//               <div className="text-center">
//                 <div className="text-2xl font-bold text-black mb-1">45m</div>
//                 <div className="text-sm text-gray-600">Time Limit</div>
//               </div>
//               <div className="text-center">
//                 <div className="text-2xl font-bold text-black mb-1">25</div>
//                 <div className="text-sm text-gray-600">Assignments</div>
//               </div>
//               <div className="text-center">
//                 <div className="text-2xl font-bold text-black mb-1">18</div>
//                 <div className="text-sm text-gray-600">Submissions</div>
//               </div>
//             </div>
//           </div>
//         )}

//         { /* Main Form Component */ }
// <AssessmentForm 
//   onGenerateWithAI={handleGenerateWithAI}
//   onSave={handleSaveAssessment}
//   onFinalizeAndAssign={handleFinalizeAndAssign}
//   loading={loading}
//   aiEnabled={backendConnected}
//   initialData={editingAssessment}
// />

// { /* Proctoring System for Preview/Assessment Mode */ }
// {showPreview && generatedAssessment?.proctoringConfig && (
//   <ProctoringSystem
//     assignmentId={generatedAssessment.id || 'preview-mode'}
//     config={generatedAssessment.proctoringConfig}
//     onViolation={(violation) => {
//       console.warn('Proctoring violation detected:', violation);
//       // You might want to handle violations during preview
//       if (generatedAssessment.id) {
//         // Update assessment with violation info
//         updateAssessmentViolations(generatedAssessment.id, violation);
//       }
//     }}
//     onStatusChange={(status) => {
//       console.log('Proctoring status:', status);
//     }}
//   />
// )}

// { /* Assessment Preview Modal */ }
// {showPreview && (
//   <AssessmentPreview 
//     assessment={generatedAssessment}
//     onClose={() => setShowPreview(false)}
//     onSave={handleSaveGeneratedAssessment}
//     onFinalizeAndAssign={() => {
//       setShowPreview(false);
//       handleFinalizeAndAssign(generatedAssessment);
//     }}
//     loading={loading}
//     proctoringConfig={generatedAssessment?.proctoringConfig}
//   />
// )}
// </div>
//     </div>
//   );
// }