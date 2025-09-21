import { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Download, 
  Mail, 
  Star, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Search,
  Trophy,
  TrendingUp,
  Filter,
  ChevronDown,
  Award,
  Target,
  BarChart3,
  Users,
  Zap,
  Eye,
  Calendar
} from 'lucide-react';
import ViolationReport from './ViolationReport';

export default function CandidateReports({ assessment, submissions, onClose }) {
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [candidateDetails, setCandidateDetails] = useState({});
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('score');
  const [showTopPerformers, setShowTopPerformers] = useState(false);
  const [showViolationReport, setShowViolationReport] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Helper function to get candidate name from submission
  const getCandidateName = (submission) => {
    return submission.candidateName || submission.name || submission.candidate?.name || 'Unknown Candidate';
  };

  // Helper function to get candidate email from submission
  const getCandidateEmail = (submission) => {
    return submission.candidateEmail || submission.email || submission.candidate?.email || 'No email provided';
  };

  // Filtered and sorted submissions
  const filteredSubmissions = useMemo(() => {
    if (!submissions || submissions.length === 0) return [];
    
    let filtered = submissions.filter(submission => {
      const candidateName = getCandidateName(submission).toLowerCase();
      const candidateEmail = getCandidateEmail(submission).toLowerCase();
      
      const matchesSearch = candidateName.includes(searchQuery.toLowerCase()) ||
                           candidateEmail.includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || 
                           (filterStatus === 'passed' && submission.passed) ||
                           (filterStatus === 'failed' && !submission.passed);
      return matchesSearch && matchesFilter;
    });

    // Sort submissions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (b.score || 0) - (a.score || 0);
        case 'name':
          return getCandidateName(a).localeCompare(getCandidateName(b));
        case 'time':
          return (b.timeSpent || 0) - (a.timeSpent || 0);
        case 'date':
          return (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [submissions, searchQuery, filterStatus, sortBy]);

  // Top performers (top 3 by score)
  const topPerformers = useMemo(() => {
    if (!submissions || submissions.length === 0) return [];
    
    return [...submissions]
      .filter(submission => submission.score !== undefined && submission.score !== null)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 3);
  }, [submissions]);

  // Statistics
  const stats = useMemo(() => {
    if (!submissions || submissions.length === 0) {
      return {
        total: 0,
        passed: 0,
        failed: 0,
        passRate: 0,
        averageScore: 0,
        averageTime: 0
      };
    }
    
    const totalSubmissions = submissions.length;
    const passedSubmissions = submissions.filter(s => s.passed === true).length;
    const averageScore = submissions.reduce((acc, s) => acc + (s.score || 0), 0) / totalSubmissions;
    const averageTime = submissions.reduce((acc, s) => acc + (s.timeSpent || 0), 0) / totalSubmissions;
    
    return {
      total: totalSubmissions,
      passed: passedSubmissions,
      failed: totalSubmissions - passedSubmissions,
      passRate: totalSubmissions > 0 ? (passedSubmissions / totalSubmissions) * 100 : 0,
      averageScore: Math.round(averageScore),
      averageTime: Math.round(averageTime)
    };
  }, [submissions]);

  useEffect(() => {
    if (filteredSubmissions.length > 0 && !selectedSubmission) {
      setSelectedSubmission(filteredSubmissions[0]);
    }
  }, [filteredSubmissions, selectedSubmission]);

  const exportToCSV = () => {
    if (!filteredSubmissions || filteredSubmissions.length === 0) {
      alert('No submissions to export');
      return;
    }
    
    const headers = ['Candidate Name', 'Email', 'Score (%)', 'Status', 'Time Spent (minutes)', 'Completed At', 'Violations'];
    const data = filteredSubmissions.map(sub => [
      getCandidateName(sub),
      getCandidateEmail(sub),
      sub.score || 0,
      sub.passed ? 'Passed' : 'Failed',
      sub.timeSpent || 'N/A',
      sub.completedAt ? new Date(sub.completedAt.seconds * 1000).toLocaleString() : 'N/A',
      sub.violations || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(field => `"${field}"`).join(',')) // Wrap fields in quotes to handle commas
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${assessment.title.replace(/\s+/g, '_')}_submissions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendResultEmail = async (submission) => {
    // Email sending logic here
    alert('Result email sent successfully!');
  };

  const generateAIAnalysis = async (submission) => {
    setLoadingAnalysis(true);
    try {
      const response = await fetch('http://localhost:5001/analyze-candidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessment: {
            title: assessment.title,
            jobRole: assessment.jobRole,
            passingScore: assessment.passingScore,
            questions: assessment.questions
          },
          submission: {
            score: submission.score,
            timeSpent: submission.timeSpent,
            violations: submission.violations,
            answers: submission.answers
          },
          candidate: {
            name: getCandidateName(submission),
            email: getCandidateEmail(submission)
          },
          jobDescription: assessment.jobDescription || ''
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const analysisData = await response.json();
      
      if (analysisData.error) {
        throw new Error(analysisData.error);
      }

      setAiAnalysis(analysisData);
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      alert('Failed to generate AI analysis. Please try again.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-hidden h-full w-full flex items-center justify-center p-4 z-50">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden border-2 border-gray-100">
        {/* Enhanced Header */}
        <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex justify-between items-center p-6">
            <div>
              <h2 className="text-2xl font-bold text-black mb-1">{assessment.title}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Users size={16} className="mr-1" />
                  {submissions.length} candidates
                </span>
                <span className="flex items-center">
                  <Target size={16} className="mr-1" />
                  {stats.passRate.toFixed(1)}% pass rate
                </span>
                <span className="flex items-center">
                  <BarChart3 size={16} className="mr-1" />
                  {stats.averageScore}% avg score
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowTopPerformers(!showTopPerformers)}
                className="flex items-center px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200 transform hover:scale-105"
              >
                <Trophy size={16} className="mr-2" />
                Top Performers
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center px-4 py-2 border-2 border-black text-black rounded-xl hover:bg-black hover:text-white transition-all duration-200"
              >
                <Download size={16} className="mr-2" />
                Export CSV
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-colors duration-200"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-black">{stats.total}</p>
                    <p className="text-sm text-gray-600">Total Submissions</p>
                  </div>
                  <Users className="text-gray-400" size={24} />
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
                    <p className="text-sm text-gray-600">Passed</p>
                  </div>
                  <CheckCircle className="text-green-400" size={24} />
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                    <p className="text-sm text-gray-600">Failed</p>
                  </div>
                  <X className="text-red-400" size={24} />
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-black">{stats.averageTime}m</p>
                    <p className="text-sm text-gray-600">Avg Time</p>
                  </div>
                  <Clock className="text-gray-400" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performers Modal */}
        {showTopPerformers && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-black flex items-center">
                  <Trophy className="mr-3 text-yellow-500" size={28} />
                  Top Performers
                </h3>
                <button
                  onClick={() => setShowTopPerformers(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                {topPerformers.length > 0 ? (
                  topPerformers.map((performer, index) => (
                    <div key={performer.id || index} className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-yellow-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-black">{getCandidateName(performer)}</h4>
                        <p className="text-gray-600 text-sm">{getCandidateEmail(performer)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-black">{performer.score || 0}%</p>
                        <p className="text-xs text-gray-500">{performer.timeSpent || 'N/A'}m</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Trophy size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No submissions available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex h-[calc(95vh-200px)]">
          {/* Enhanced Sidebar */}
          <div className="w-1/3 border-r border-gray-100 bg-gray-50 overflow-hidden flex flex-col">
            {/* Search and Filters */}
            <div className="p-4 bg-white border-b border-gray-100">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                />
              </div>
              
              <div className="flex space-x-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="score">Sort by Score</option>
                  <option value="name">Sort by Name</option>
                  <option value="time">Sort by Time</option>
                  <option value="date">Sort by Date</option>
                </select>
              </div>
            </div>

            {/* Submissions List */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h3 className="font-semibold text-black mb-4 flex items-center">
                  <Filter size={16} className="mr-2" />
                  Submissions ({filteredSubmissions.length})
                </h3>
                <div className="space-y-3">
                  {filteredSubmissions.length > 0 ? (
                    filteredSubmissions.map((submission, index) => (
                      <div
                        key={submission.id || index}
                        className={`group p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 hover:shadow-md ${
                          selectedSubmission?.id === submission.id
                            ? 'border-black bg-white shadow-lg transform scale-[1.02]'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-black group-hover:text-gray-800">
                              {getCandidateName(submission)}
                            </h4>
                            <p className="text-sm text-gray-600 truncate">{getCandidateEmail(submission)}</p>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                              submission.passed 
                                ? 'bg-black text-white' 
                                : 'bg-gray-200 text-gray-800'
                            }`}>
                              {submission.score || 0}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center">
                            <Clock size={12} className="mr-1" />
                            {submission.timeSpent || 'N/A'}m
                          </span>
                          <span className="flex items-center">
                            <Calendar size={12} className="mr-1" />
                            {submission.completedAt ? new Date(submission.completedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        
                        {(submission.violations || 0) > 0 && (
                          <div className="mt-2 flex items-center text-xs text-red-600">
                            <AlertCircle size={12} className="mr-1" />
                            {submission.violations} violation(s)
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Search size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No submissions found</p>
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Main Content */}
          <div className="w-2/3 overflow-y-auto bg-white">
            {selectedSubmission ? (
              <div className="p-8">
                {/* Candidate Header */}
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 mb-8 border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold text-black mb-2">
                        {getCandidateName(selectedSubmission)}
                      </h3>
                      <p className="text-gray-600 mb-3">
                        {getCandidateEmail(selectedSubmission)}
                      </p>
                      <div className="flex items-center space-x-4">
                        <div className={`inline-flex items-center px-4 py-2 rounded-xl font-bold ${
                          selectedSubmission.passed 
                            ? 'bg-black text-white' 
                            : 'bg-gray-200 text-gray-800'
                        }`}>
                          {selectedSubmission.passed ? 'PASSED' : 'FAILED'} - {selectedSubmission.score || 0}%
                        </div>
                        <span className="text-sm text-gray-600 flex items-center">
                          <Clock size={16} className="mr-1" />
                          {selectedSubmission.timeSpent || 'N/A'} minutes
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => sendResultEmail(selectedSubmission)}
                        className="flex items-center px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200 transform hover:scale-105"
                      >
                        <Mail size={16} className="mr-2" />
                        Send Result
                      </button>
                      <button
                        onClick={() => generateAIAnalysis(selectedSubmission)}
                        disabled={loadingAnalysis}
                        className="flex items-center px-4 py-2 border-2 border-black text-black rounded-xl hover:bg-black hover:text-white transition-all duration-200 disabled:opacity-50"
                      >
                        <Zap size={16} className="mr-2" />
                        {loadingAnalysis ? 'Analyzing...' : 'AI Analysis'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex space-x-1 mb-8 bg-gray-100 rounded-xl p-1">
                  {[
                    { id: 'overview', label: 'Overview', icon: Eye },
                    { id: 'answers', label: 'Answers', icon: CheckCircle },
                    { id: 'analysis', label: 'AI Analysis', icon: Star }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-white text-black shadow-md'
                          : 'text-gray-600 hover:text-black'
                      }`}
                    >
                      <tab.icon size={16} className="mr-2" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Violations */}
                    {selectedSubmission.violations > 0 && (
                      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                        <div className="flex items-center mb-3">
                          <AlertCircle className="text-red-600 mr-3" size={24} />
                          <h4 className="font-bold text-red-800 text-lg">
                            {selectedSubmission.violations > 0 ? 'Proctoring Violations Detected' : 'No Violations Detected'}
                          </h4>
                        </div>
                        <p className="text-red-700 mb-4">
                          {selectedSubmission.violations || 0} violation{selectedSubmission.violations !== 1 ? 's' : ''} detected during this assessment
                        </p>
                        {selectedSubmission.violations > 0 && (
                          <button
                            onClick={() => setShowViolationReport(true)}
                            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200">
                            View Violation Report
                          </button>
                        )}
                        {showViolationReport && (
                          <ViolationReport 
                            submission={selectedSubmission} 
                            onClose={() => setShowViolationReport(false)} 
                          />
                        )}
                      </div>
                    )}

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-semibold text-black">Score</h5>
                          <Target className="text-gray-400" size={24} />
                        </div>
                        <p className="text-3xl font-bold text-black">{selectedSubmission.score}%</p>
                        <p className="text-sm text-gray-600 mt-2">
                          {selectedSubmission.passed ? 'Above passing threshold' : 'Below passing threshold'}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-semibold text-black">Time Efficiency</h5>
                          <TrendingUp className="text-gray-400" size={24} />
                        </div>
                        <p className="text-3xl font-bold text-black">{selectedSubmission.timeSpent || 'N/A'}m</p>
                        <p className="text-sm text-gray-600 mt-2">
                          vs {stats.averageTime}m average
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-semibold text-black">Ranking</h5>
                          <Award className="text-gray-400" size={24} />
                        </div>
                        <p className="text-3xl font-bold text-black">
                          #{submissions.findIndex(s => s.id === selectedSubmission.id) + 1}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          of {submissions.length} candidates
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'answers' && (
                  <div className="space-y-4">
                    {assessment.questions?.map((question, index) => {
                      const userAnswer = selectedSubmission.answers?.[question.id];
                      const isCorrect = userAnswer === question.correctAnswer;
                      
                      return (
                        <div key={question.id} className="bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-3">
                                <span className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                                  {index + 1}
                                </span>
                                <h5 className="font-semibold text-black text-lg">
                                  {question.question}
                                </h5>
                              </div>
                              <div className="ml-11 space-y-2">
                                <p className="text-gray-700">
                                  <span className="font-semibold">Candidate's answer:</span> 
                                  <span className={`ml-2 px-3 py-1 rounded-lg ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {userAnswer || 'Not answered'}
                                  </span>
                                </p>
                                {!isCorrect && (
                                  <p className="text-gray-700">
                                    <span className="font-semibold">Correct answer:</span>
                                    <span className="ml-2 px-3 py-1 rounded-lg bg-green-100 text-green-800">
                                      {question.correctAnswer}
                                    </span>
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className={`ml-6 p-3 rounded-full ${
                              isCorrect 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {isCorrect ? <CheckCircle size={20} /> : <X size={20} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeTab === 'analysis' && (
                  <div>
                    {aiAnalysis ? (
                      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-200">
                        <h4 className="font-bold text-black text-xl mb-6 flex items-center">
                          <Star size={24} className="mr-3 text-black" />
                          AI Candidate Analysis
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-6 mb-8">
                          <div className="bg-white p-6 rounded-xl border border-gray-200">
                            <h5 className="font-semibold text-black mb-4">Skills Match</h5>
                            <div className="mb-3">
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                  className="bg-black h-3 rounded-full transition-all duration-1000" 
                                  style={{ width: `${aiAnalysis.skillsMatch}%` }}
                                ></div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{aiAnalysis.skillsMatch}% match with job requirements</p>
                          </div>
                          
                          <div className="bg-white p-6 rounded-xl border border-gray-200">
                            <h5 className="font-semibold text-black mb-4">Overall Score</h5>
                            <div className="text-4xl font-bold text-black mb-2">
                              {aiAnalysis.overallScore}/100
                            </div>
                            <p className="text-sm text-gray-600">{aiAnalysis.overallAssessment}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <h5 className="font-semibold text-black mb-4">Strengths</h5>
                            <div className="space-y-2">
                              {aiAnalysis.strengths.map((strength, index) => (
                                <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                                  <CheckCircle size={16} className="text-green-600 mr-3" />
                                  <span className="text-green-800">{strength}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h5 className="font-semibold text-black mb-4">Areas for Improvement</h5>
                            <div className="space-y-2">
                              {aiAnalysis.areasForImprovement.map((area, index) => (
                                <div key={index} className="flex items-center p-3 bg-red-50 rounded-lg">
                                  <AlertCircle size={16} className="text-red-600 mr-3" />
                                  <span className="text-red-800">{area}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-200">
                          <h5 className="font-semibold text-black mb-3">Recommendation</h5>
                          <p className="text-gray-700 leading-relaxed">{aiAnalysis.recommendation}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Star size={48} className="mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 mb-4">Click "AI Analysis" to generate insights for this candidate</p>
                        <button
                          onClick={() => generateAIAnalysis(selectedSubmission)}
                          disabled={loadingAnalysis}
                          className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200 disabled:opacity-50"
                        >
                          {loadingAnalysis ? 'Generating Analysis...' : 'Generate AI Analysis'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Users size={64} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a Candidate</h3>
                  <p className="text-gray-500">Choose a submission from the sidebar to view detailed analysis</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}