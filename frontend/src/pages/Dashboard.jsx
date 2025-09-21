// // src/pages/Dashboard.jsx
// import { useAuth } from '../hooks/useAuth';
import InterviewerDashboard from '../components/dashboard/InterviewerDashboard';
import CandidateDashboard from '../components/dashboard/CandidateDashboard';
// import LoadingSpinner from '../components/common/LoadingSpinner';

// export default function Dashboard() {
//   const { userData, loading } = useAuth();

//   if (loading) return <LoadingSpinner />;

//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//       <div className="mb-8">
//         <h1 className="text-2xl font-bold text-gray-900">
//           Welcome back, {userData?.name || userData?.email}!
//         </h1>
//         <p className="mt-1 text-sm text-gray-600">
//           {userData?.role === 'interviewer' 
//             ? 'Manage assessments and track candidate progress' 
//             : 'View your assigned assessments and results'}
//         </p>
//       </div>

//       {userData?.role === 'interviewer' ? (
//         <InterviewerDashboard />
//       ) : (
//         <CandidateDashboard />
//       )}
//     </div>
//   );
// }




import { useState, useEffect } from 'react';
import { 
  User, Settings, Bell, Search, Calendar, 
  TrendingUp, Activity, Clock, Target,
  ChevronRight, Sparkles, Zap, Award,
  BarChart3, Users, CheckCircle, Plus,
  ArrowRight, RefreshCw, Sun, Moon,
  MessageSquare, HelpCircle, LogOut,
  Briefcase, Shield, Star, Globe
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// Mock LoadingSpinner component for demonstration
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center space-y-6">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-black"></div>
        <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-black opacity-20"></div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-xl font-semibold text-black animate-pulse">Loading Dashboard</p>
        <p className="text-gray-600">Please wait while we prepare your workspace...</p>
      </div>
    </div>
  </div>
);

// Mock components for demonstration
// const InterviewerDashboard = () => (
//   <div className="space-y-8">
//     <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
//       <Briefcase size={48} className="mx-auto mb-4 text-gray-400" />
//       <h3 className="text-xl font-semibold text-black mb-2">Interviewer Dashboard</h3>
//       <p className="text-gray-600">Your interviewer dashboard components will load here</p>
//     </div>
//   </div>
// );

// const CandidateDashboard = () => (
//   <div className="space-y-8">
//     <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
//       <User size={48} className="mx-auto mb-4 text-gray-400" />
//       <h3 className="text-xl font-semibold text-black mb-2">Candidate Dashboard</h3>
//       <p className="text-gray-600">Your candidate dashboard components will load here</p>
//     </div>
//   </div>
// );

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(true);
  const { userData, loading } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    // Hide welcome animation after 3 seconds
    const welcomeTimer = setTimeout(() => {
      setShowWelcomeAnimation(false);
    }, 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(welcomeTimer);
    };
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleIcon = (role) => {
    return role === 'interviewer' ? <Briefcase size={20} /> : <User size={20} />;
  };

  const getRoleColor = (role) => {
    return role === 'interviewer' ? 'bg-black text-white' : 'bg-gray-800 text-white';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              {/* User Avatar */}
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-full flex items-center justify-center shadow-lg">
                  <User size={20} className="text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              
              {/* Welcome Message */}
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h1 className={`text-2xl font-bold text-black transition-all duration-500 ${
                    showWelcomeAnimation ? 'animate-pulse' : ''
                  }`}>
                    {getGreeting()}, {userData?.name || userData?.email?.split('@')[0] || 'User'}!
                  </h1>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${getRoleColor(userData?.role)}`}>
                    {getRoleIcon(userData?.role)}
                    <span className="ml-1 capitalize">{userData?.role || 'User'}</span>
                  </div>
                </div>
                <p className="text-gray-600 flex items-center">
                  {userData?.role === 'interviewer' 
                    ? (
                      <>
                        <Target size={16} className="mr-2" />
                        Manage assessments and track candidate progress
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} className="mr-2" />
                        View your assigned assessments and results
                      </>
                    )
                  }
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-xl">
                <Calendar size={16} className="mr-2" />
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
              
              <button className="relative p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-xl transition-all duration-200">
                <Bell size={20} />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </button>
              
              <button className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-xl transition-all duration-200">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-lg font-semibold text-black">
                  {currentTime.toLocaleDateString()}
                </p>
              </div>
              <Calendar className="text-gray-400" size={20} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold text-green-600">Active</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Login</p>
                <p className="text-lg font-semibold text-black">Now</p>
              </div>
              <Clock className="text-gray-400" size={20} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Version</p>
                <p className="text-lg font-semibold text-black">v2.0</p>
              </div>
              <Sparkles className="text-gray-400" size={20} />
            </div>
          </div>
        </div>

        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-gray-900 to-black text-white p-8 rounded-2xl shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-5"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full opacity-5 transform translate-x-32 -translate-y-32"></div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Welcome to your {userData?.role === 'interviewer' ? 'Assessment Hub' : 'Learning Portal'}
                </h2>
                <p className="text-gray-300 mb-6 max-w-2xl">
                  {userData?.role === 'interviewer' 
                    ? 'Create, manage, and analyze technical assessments. Track candidate performance and make data-driven hiring decisions.'
                    : 'Access your assigned assessments, track your progress, and showcase your technical skills to potential employers.'
                  }
                </p>
                <div className="flex items-center space-x-4">
                  <button className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center">
                    <Zap size={16} className="mr-2" />
                    Get Started
                    <ArrowRight size={16} className="ml-2" />
                  </button>
                  <button className="border border-white text-white px-6 py-3 rounded-xl font-semibold hover:bg-white hover:text-black transition-all duration-200 flex items-center">
                    <HelpCircle size={16} className="mr-2" />
                    Learn More
                  </button>
                </div>
              </div>
              
              <div className="hidden lg:block">
                <div className="w-32 h-32 bg-white bg-opacity-10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  {userData?.role === 'interviewer' ? (
                    <BarChart3 size={48} className="text-white" />
                  ) : (
                    <Award size={48} className="text-white" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Role-specific Dashboard Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-black flex items-center">
              <Activity size={24} className="mr-3" />
              Dashboard Overview
            </h3>
            <button className="flex items-center px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl hover:border-black hover:text-black transition-all duration-200">
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </button>
          </div>
          
          {userData?.role === 'interviewer' ? (
            <InterviewerDashboard />
          ) : (
            <CandidateDashboard />
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p className="flex items-center justify-center space-x-2">
            <Globe size={16} />
            <span>Powered by QuantAI, NZ</span>
            <span>•</span>
            <span>© 2025 All rights reserved</span>
          </p>
        </div>
      </div>
    </div>
  );
}