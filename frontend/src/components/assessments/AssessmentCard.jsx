// src/components/assessments/AssessmentCard.jsx
import { Link } from 'react-router-dom';
import { 
  Clock, 
  Users, 
  CheckCircle, 
  BarChart3, 
  AlertCircle, 
  Play,
  Zap,
  Code,
  FileText,
  Globe,
  Target,
  Calendar,
  Award,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

export default function AssessmentCard({ 
  assessment, 
  assignment, 
  showActions = false, 
  showResults = false 
}) {
  const [isHovered, setIsHovered] = useState(false);

  // If assessment data is missing but we have assignment data with assessment info
  const getEffectiveAssessment = () => {
    if (assessment) return assessment;
    
    // Fallback to assignment data if assessment is missing
    if (assignment) {
      return {
        id: assignment.assessmentId,
        title: assignment.assessmentTitle || 'Unknown Assessment',
        description: assignment.assessmentDescription || '',
        jobRole: assignment.jobRole || '',
        type: assignment.assessmentType || 'multiple_choice',
        difficulty: 'intermediate',
        timeLimit: assignment.timeLimit || 30,
        passingScore: assignment.passingScore || 70,
        questions: assignment.questions || [],
        assignments: 0,
        submissions: 0
      };
    }
    
    return null;
  };

  const effectiveAssessment = getEffectiveAssessment();

  if (!effectiveAssessment && !assignment) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6 transition-all duration-300 hover:shadow-md">
        <div className="flex items-center text-gray-600">
          <AlertCircle size={16} className="mr-2" />
          <span className="text-sm">Assessment data not available</span>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      assigned: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Assigned' },
      'in-progress': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'In Progress' },
      completed: { bg: 'bg-black', text: 'text-white', label: 'Completed' },
      expired: { bg: 'bg-gray-800', text: 'text-white', label: 'Expired' }
    };
    
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unknown' };
    
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text} transition-colors duration-200`}>
        {config.label}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    const iconConfig = {
      multiple_choice: { icon: <FileText size={16} className="text-gray-600" />, label: 'Multiple Choice' },
      coding: { icon: <Code size={16} className="text-gray-600" />, label: 'Coding' },
      text: { icon: <FileText size={16} className="text-gray-600" />, label: 'Text' },
      full_stack: { icon: <Globe size={16} className="text-gray-600" />, label: 'Full Stack' }
    };
    
    return iconConfig[type] || { icon: <Zap size={16} className="text-gray-600" />, label: 'Assessment' };
  };

  const getDifficultyBadge = (difficulty) => {
    const difficultyConfig = {
      easy: { bg: 'bg-gray-100', text: 'text-gray-700' },
      intermediate: { bg: 'bg-gray-200', text: 'text-gray-800' },
      hard: { bg: 'bg-gray-300', text: 'text-gray-900' }
    };
    
    const config = difficultyConfig[difficulty] || { bg: 'bg-gray-100', text: 'text-gray-700' };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-md ${config.bg} ${config.text} capitalize`}>
        {difficulty || 'intermediate'}
      </span>
    );
  };

  const getTimeRemaining = () => {
    if (!assignment?.expiresAt) return null;
    
    const now = new Date();
    const expiresAt = assignment.expiresAt.toDate();
    const timeDiff = expiresAt - now;
    
    if (timeDiff <= 0) return 'Expired';
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const isAssessmentAvailable = () => {
    if (!assignment) return false;
    if (assignment.status === 'completed') return false;
    if (assignment.status === 'expired') return false;
    
    // Check if assessment has expired
    if (assignment.expiresAt) {
      const now = new Date();
      const expiresAt = assignment.expiresAt.toDate();
      return expiresAt > now;
    }
    
    return true;
  };

  const getAssessmentId = () => {
    return effectiveAssessment?.id || assignment?.assessmentId;
  };

  const typeConfig = getTypeIcon(effectiveAssessment?.type);

  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)'
      }}
    >
      <div className="p-6 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <div className="p-2 bg-gray-100 rounded-lg mr-3 transition-colors duration-200 group-hover:bg-gray-200">
                {typeConfig.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                {effectiveAssessment?.title || 'Untitled Assessment'}
              </h3>
            </div>
            <p className="text-sm text-gray-500 flex items-center">
              <Target size={14} className="mr-1" />
              {effectiveAssessment?.jobRole || 'No role specified'}
            </p>
          </div>
          {assignment && (
            <div className="flex-shrink-0 ml-2">
              {getStatusBadge(assignment.status)}
            </div>
          )}
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {effectiveAssessment?.description || assignment?.assessmentDescription || 'No description provided'}
        </p>
        
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg mr-2 transition-colors duration-200 group-hover:bg-gray-200">
              <Clock size={14} className="text-gray-600" />
            </div>
            <span className="truncate text-gray-700">{effectiveAssessment?.timeLimit || 30} min</span>
          </div>
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg mr-2 transition-colors duration-200 group-hover:bg-gray-200">
              <BarChart3 size={14} className="text-gray-600" />
            </div>
            <span className="truncate text-gray-700">{effectiveAssessment?.questions?.length || 0} questions</span>
          </div>
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg mr-2 transition-colors duration-200 group-hover:bg-gray-200">
              <Users size={14} className="text-gray-600" />
            </div>
            <span className="truncate text-gray-700">{effectiveAssessment?.assignments || 0} assigned</span>
          </div>
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg mr-2 transition-colors duration-200 group-hover:bg-gray-200">
              <CheckCircle size={14} className="text-gray-600" />
            </div>
            <span className="truncate text-gray-700">{effectiveAssessment?.submissions || 0} submissions</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          {getDifficultyBadge(effectiveAssessment?.difficulty)}
          <span className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md capitalize">
            {typeConfig.label}
          </span>
        </div>

        {/* Time remaining indicator */}
        {assignment?.expiresAt && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100 transition-colors duration-200 group-hover:bg-gray-100">
            <div className="text-xs text-gray-600 flex items-center">
              <Clock size={12} className="mr-2 flex-shrink-0" />
              <span className="truncate font-medium">{getTimeRemaining()}</span>
            </div>
          </div>
        )}

        {showResults && assignment && (
          <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100 transition-colors duration-200 group-hover:bg-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 font-medium flex items-center">
                <Award size={14} className="mr-1" />
                Score:
              </span>
              <span className={`font-bold text-lg ${assignment.passed ? 'text-black' : 'text-gray-700'}`}>
                {assignment.score || 0}%
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {assignment.passed ? 'Passed' : 'Failed'} • Need {effectiveAssessment?.passingScore || 70}% to pass
            </div>
            {assignment.completedAt && (
              <div className="text-xs text-gray-500 mt-2 flex items-center">
                <Calendar size={12} className="mr-1" />
                Completed on {assignment.completedAt.toDate().toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {showActions && assignment && getAssessmentId() && isAssessmentAvailable() && (
          <Link
            to={`/assessment/take/${getAssessmentId()}`}
            className="flex items-center justify-between w-full bg-black text-white py-3 px-4 rounded-xl transition-all duration-300 font-medium group/button hover:bg-gray-800"
          >
            <span className="flex items-center">
              <Play size={16} className="mr-2" />
              {assignment.status === 'assigned' ? 'Start Assessment' : 'Continue Assessment'}
            </span>
            <ChevronRight size={16} className="transition-transform duration-300 group-hover/button:translate-x-1" />
          </Link>
        )}

        {showActions && assignment && !isAssessmentAvailable() && (
          <div className="text-center py-3 text-sm text-gray-500 border border-gray-200 rounded-xl">
            {assignment.status === 'completed' ? 'Assessment completed' : 'Assessment expired'}
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 transition-colors duration-200 group-hover:bg-gray-100">
        <div className="text-xs text-gray-500 flex items-center">
          <Calendar size={12} className="mr-1" />
          {assignment?.assignedAt ? (
            <>Assigned on {assignment.assignedAt.toDate().toLocaleDateString()}</>
          ) : (
            <>Created {effectiveAssessment?.createdAt?.toDate?.().toLocaleDateString() || 'Unknown date'}</>
          )}
        </div>
      </div>
    </div>
  );
}