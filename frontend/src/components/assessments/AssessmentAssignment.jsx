// src/components/assessments/AssessmentAssignment.jsx
import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function AssessmentAssignment({ assessmentId, assessmentData, onClose, onSendEmail }) {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailTemplate, setEmailTemplate] = useState({
    subject: `Assessment Invitation: ${assessmentData?.title || ''}`,
    message: `You have been invited to take the assessment "${assessmentData?.title || ''}".\n\nPlease complete it by the due date.`
  });

  useEffect(() => {
    async function loadCandidates() {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'candidate'));
        const querySnapshot = await getDocs(q);
        const candidatesData = [];
        
        querySnapshot.forEach(doc => {
          candidatesData.push({ id: doc.id, ...doc.data() });
        });
        
        setCandidates(candidatesData);
      } catch (err) {
        setError('Failed to load candidates: ' + err.message);
      }
    }

    loadCandidates();
  }, []);

  const handleCandidateSelect = (candidateId) => {
    setSelectedCandidates(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId);
      } else {
        return [...prev, candidateId];
      }
    });
  };

  const handleAssign = async () => {
    if (selectedCandidates.length === 0) {
      setError('Please select at least one candidate');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const emailResults = [];
      
      for (const candidateId of selectedCandidates) {
        const candidate = candidates.find(c => c.id === candidateId);
        
        // Create assignment
        const assignmentData = {
          assessmentId,
          candidateId: candidate.id,
          candidateEmail: candidate.email,
          candidateName: candidate.name,
          status: 'assigned',
          assignedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          assessmentTitle: assessmentData.title,
          assessmentDescription: assessmentData.description,
          timeLimit: assessmentData.timeLimit
        };
        
        const assignmentRef = await addDoc(collection(db, 'assignments'), assignmentData);
        
        // Send email
        const emailSent = await onSendEmail(assessmentData, candidate.email, 'assigned');
        emailResults.push({
          candidate: candidate.email,
          success: emailSent
        });
      }
      
      // Update assessment assignments count
      await updateDoc(doc(db, 'assessments', assessmentId), {
        assignments: (assessmentData.assignments || 0) + selectedCandidates.length
      });
      
      const successfulEmails = emailResults.filter(r => r.success).length;
      setSuccess(`Assessment assigned to ${selectedCandidates.length} candidates. ${successfulEmails}/${selectedCandidates.length} emails sent successfully.`);
      
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      setError('Failed to assign assessment: ' + err.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Assign Assessment</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            {success}
          </div>
        )}
        
        {/* Email Template Editor */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Email Template</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={emailTemplate.subject}
                onChange={(e) => setEmailTemplate({...emailTemplate, subject: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                rows={4}
                value={emailTemplate.message}
                onChange={(e) => setEmailTemplate({...emailTemplate, message: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="font-medium text-gray-900 mb-2">Select Candidates</h3>
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
            {candidates.map(candidate => (
              <div key={candidate.id} className="flex items-center p-3 border-b border-gray-200 last:border-b-0">
                <input
                  id={`candidate-${candidate.id}`}
                  type="checkbox"
                  checked={selectedCandidates.includes(candidate.id)}
                  onChange={() => handleCandidateSelect(candidate.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`candidate-${candidate.id}`} className="ml-3 block text-sm text-gray-900">
                  {candidate.name} ({candidate.email})
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Assigning...' : 'Assign Assessment'}
          </button>
        </div>
      </div>
    </div>
  );
}

