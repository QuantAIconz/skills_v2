// src/components/dashboard/CandidateDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import AssessmentCard from '../assessments/AssessmentCard';
import { Clock, AlertCircle, CheckCircle, XCircle, BarChart3, Calendar, Filter, Search } from 'lucide-react';

export default function CandidateDashboard() {
  const [assignedAssessments, setAssignedAssessments] = useState([]);
  const [completedAssessments, setCompletedAssessments] = useState([]);
  const [expiredAssessments, setExpiredAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assigned');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'assignments'),
      where('candidateId', '==', user.uid),
      orderBy('assignedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const assignments = [];
      const completed = [];
      const expired = [];
      
      const now = new Date();
      
      for (const doc of querySnapshot.docs) {
        const assignment = { id: doc.id, ...doc.data() };
        
        // Check if assessment is expired
        if (assignment.expiresAt && assignment.expiresAt.toDate() < now && assignment.status !== 'completed') {
          assignment.status = 'expired';
          expired.push(assignment);
          continue;
        }
        
        // Get assessment details
        try {
          const assessmentDoc = await getDocs(query(
            collection(db, 'assessments'),
            where('__name__', '==', assignment.assessmentId)
          ));
          
          if (!assessmentDoc.empty) {
            const assessmentData = assessmentDoc.docs[0].data();
            const assessmentWithDetails = { 
              ...assignment, 
              assessment: assessmentData,
              daysLeft: assignment.expiresAt 
                ? Math.ceil((assignment.expiresAt.toDate() - now) / (1000 * 60 * 60 * 24))
                : null
            };
            
            if (assignment.status === 'completed') {
              completed.push(assessmentWithDetails);
            } else {
              assignments.push(assessmentWithDetails);
            }
          }
        } catch (error) {
          console.error('Error fetching assessment details:', error);
        }
      }
      
      setAssignedAssessments(assignments);
      setCompletedAssessments(completed);
      setExpiredAssessments(expired);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const getCurrentAssessments = () => {
    let assessments = [];
    switch (activeTab) {
      case 'assigned': assessments = assignedAssessments; break;
      case 'completed': assessments = completedAssessments; break;
      case 'expired': assessments = expiredAssessments; break;
      default: assessments = assignedAssessments;
    }
    
    return assessments.filter(assignment => 
      assignment.assessment?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.assessment?.jobRole?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-500" />;
      case 'expired': return <XCircle size={16} className="text-red-500" />;
      default: return <Clock size={16} className="text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentAssessments = getCurrentAssessments();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Your Assessments</h2>
        <p className="mt-1 text-sm text-gray-600">
          View your assigned assessments and results
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{assignedAssessments.length}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedAssessments.length}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-red-100 text-red-600 mr-3">
              <XCircle size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{expiredAssessments.length}</p>
              <p className="text-sm text-gray-500">Expired</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'assigned', name: 'Assigned', count: assignedAssessments.length },
              { id: 'completed', name: 'Completed', count: completedAssessments.length },
              { id: 'expired', name: 'Expired', count: expiredAssessments.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.name} ({tab.count})
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search assessments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Assessments List */}
      {currentAssessments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentAssessments.map((assignment) => (
            <AssessmentCard 
              key={assignment.id} 
              assessment={assignment.assessment} 
              assignment={assignment}
              showActions={activeTab === 'assigned'}
              showResults={activeTab === 'completed'}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-gray-400 mb-4">
            {activeTab === 'assigned' && <Clock size={48} className="mx-auto" />}
            {activeTab === 'completed' && <CheckCircle size={48} className="mx-auto" />}
            {activeTab === 'expired' && <XCircle size={48} className="mx-auto" />}
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            {activeTab === 'assigned' && 'No assessments assigned'}
            {activeTab === 'completed' && 'No assessments completed'}
            {activeTab === 'expired' && 'No assessments expired'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {activeTab === 'assigned' && 'You don\'t have any pending assessments at the moment.'}
            {activeTab === 'completed' && 'You haven\'t completed any assessments yet.'}
            {activeTab === 'expired' && 'No assessments have expired.'}
          </p>
        </div>
      )}
    </div>
  );
}