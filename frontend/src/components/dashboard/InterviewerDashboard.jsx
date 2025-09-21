// src/components/dashboard/InterviewerDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  collection, query, where, onSnapshot, 
  doc, updateDoc, deleteDoc, getDocs,
  addDoc, orderBy 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import AssessmentCard from '../assessments/AssessmentCard';
import StatsOverview from '../dashboard/StatsOverview';
import AssessmentAssignment from '../assessments/AssessmentAssignment';
import CandidateReports from '../assessments/CandidateReports';
import { 
  BarChart3, Users, CheckCircle, Clock, Plus, 
  Send, Edit, Trash2, Filter, Search, FileText,
  Mail, AlertCircle, Star, Download
} from 'lucide-react';

export default function InterviewerDashboard() {
  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [submissions, setSubmissions] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'assessments'),
      where('createdBy', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const assessmentsData = [];
      querySnapshot.forEach((doc) => {
        assessmentsData.push({ id: doc.id, ...doc.data() });
      });
      setAssessments(assessmentsData);
      setFilteredAssessments(assessmentsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    let filtered = assessments;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(assessment => 
        assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.jobRole.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(assessment => assessment.type === filterType);
    }
    
    setFilteredAssessments(filtered);
  }, [assessments, searchTerm, filterType]);

  // Load submissions for selected assessment
  useEffect(() => {
    if (selectedAssessment) {
      loadSubmissions(selectedAssessment.id);
    }
  }, [selectedAssessment]);

  const loadSubmissions = async (assessmentId) => {
    try {
      const submissionsQuery = query(
        collection(db, 'assignments'),
        where('assessmentId', '==', assessmentId),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(submissionsQuery);
      const submissionsData = [];
      
      querySnapshot.forEach((doc) => {
        submissionsData.push({ id: doc.id, ...doc.data() });
      });
      
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  // Calculate stats for the dashboard
  const totalAssessments = assessments.length;
  const totalAssignments = assessments.reduce((acc, assessment) => 
    acc + (assessment.assignments || 0), 0
  );
  const totalSubmissions = assessments.reduce((acc, assessment) => 
    acc + (assessment.submissions || 0), 0
  );

  const handleAssignAssessment = (assessment) => {
    setSelectedAssessment(assessment);
    setShowAssignmentModal(true);
  };

  const handleViewReports = (assessment) => {
    setSelectedAssessment(assessment);
    setShowReportsModal(true);
  };

  const handleDeleteAssessment = async (assessmentId) => {
    if (window.confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      try {
        // Delete the assessment
        await deleteDoc(doc(db, 'assessments', assessmentId));
        
        // Also delete any assignments related to this assessment
        const assignmentsQuery = query(
          collection(db, 'assignments'),
          where('assessmentId', '==', assessmentId)
        );
        const querySnapshot = await getDocs(assignmentsQuery);
        
        querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
        
        alert('Assessment deleted successfully');
      } catch (error) {
        console.error('Error deleting assessment:', error);
        alert('Failed to delete assessment');
      }
    }
  };

  const handleDuplicateAssessment = async (assessment) => {
    try {
      const { id, createdAt, assignments, submissions, ...assessmentData } = assessment;
      const newAssessment = {
        ...assessmentData,
        title: `${assessmentData.title} (Copy)`,
        createdBy: user.uid,
        createdAt: new Date(),
        assignments: 0,
        submissions: 0
      };
      
      await addDoc(collection(db, 'assessments'), newAssessment);
      alert('Assessment duplicated successfully');
    } catch (error) {
      console.error('Error duplicating assessment:', error);
      alert('Failed to duplicate assessment');
    }
  };

  const sendAssessmentEmail = async (assessment, candidateEmail, type = 'assigned') => {
    try {
      // This would call your backend email service
      const response = await fetch('https://skills-v2-emailservice.onrender.com/send-assessment-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessment,
          candidateEmail,
          type,
          interviewerEmail: user.email
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Your Assessments</h2>
        <Link
          to="/assessment/create"
          className="bg-black hover:bg-white hover:text-black border-1 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center"
        >
          <Plus size={16} className="mr-1" />
          Create New Assessment
        </Link>
      </div>

      <StatsOverview 
        totalAssessments={totalAssessments}
        totalAssignments={totalAssignments}
        totalSubmissions={totalSubmissions}
        submissionsData={{
          passed: submissions.filter(s => s.passed).length,
          failed: submissions.filter(s => !s.passed).length,
          inProgress: 0 // You might need to calculate this
        }}
      />

      {/* Search and Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search assessments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="coding">Coding</option>
            <option value="text">Text Response</option>
            <option value="full_stack">Full Stack</option>
          </select>
        </div>
      </div>

      {filteredAssessments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssessments.map((assessment) => (
            <div key={assessment.id} className="relative">
              <AssessmentCard 
                assessment={assessment} 
                showActions={true}
              />
              
              {/* Action buttons */}
              <div className="absolute top-4 right-4 flex flex-col space-y-2">
                <button
                  onClick={() => handleAssignAssessment(assessment)}
                  className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full shadow-md"
                  title="Assign to candidates"
                >
                  <Send size={14} />
                </button>
                
                <button
                  onClick={() => handleViewReports(assessment)}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow-md"
                  title="View candidate reports"
                >
                  <FileText size={14} />
                </button>
                
                <Link
                  to={`/assessment/edit/${assessment.id}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-md"
                  title="Edit assessment"
                >
                  <Edit size={14} />
                </Link>
                
                <button
                  onClick={() => handleDuplicateAssessment(assessment)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-md"
                  title="Duplicate assessment"
                >
                  <Plus size={14} />
                </button>
                
                <button
                  onClick={() => handleDeleteAssessment(assessment.id)}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-md"
                  title="Delete assessment"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">No assessments found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Get started by creating your first assessment.'
            }
          </p>
          {!searchTerm && filterType === 'all' && (
            <div className="mt-6">
              <Link
                to="/assessment/create"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus size={16} className="mr-1" />
                Create Assessment
              </Link>
            </div>
          )}
        </div>
      )}

      {showAssignmentModal && (
        <AssessmentAssignment 
          assessmentId={selectedAssessment.id}
          assessmentData={selectedAssessment}
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedAssessment(null);
          }}
          onSendEmail={sendAssessmentEmail}
        />
      )}

      {showReportsModal && selectedAssessment && (
        <CandidateReports
          assessment={selectedAssessment}
          submissions={submissions}
          onClose={() => {
            setShowReportsModal(false);
            setSelectedAssessment(null);
          }}
        />
      )}
    </div>
  );
}