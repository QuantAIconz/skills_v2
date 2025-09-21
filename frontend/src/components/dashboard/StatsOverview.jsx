// src/components/dashboard/StatsOverview.jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useState, useEffect } from 'react';
import { 
  Users, CheckCircle, FileText, Clock, 
  TrendingUp, TrendingDown, Target, Award,
  BarChart3, Activity, Zap,
  ArrowUp, ArrowDown, Minus, Eye
} from 'lucide-react';

// Custom Chart Components (simplified for black/white theme)
const SimpleBarChart = ({ data, height = 200 }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="flex items-end justify-between space-x-2" style={{ height }}>
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div 
            className="w-full bg-gray-900 rounded-t-lg transition-all duration-1000 hover:bg-black"
            style={{ 
              height: `${(item.value / maxValue) * 160}px`,
              minHeight: item.value > 0 ? '8px' : '2px'
            }}
          ></div>
          <div className="text-xs text-gray-600 mt-2 text-center">
            <div className="font-semibold">{item.value}</div>
            <div className="truncate">{item.name}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const SimplePieChart = ({ data, size = 160 }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  let cumulativePercentage = 0;
  
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="text-center text-gray-400">
          <PieChart size={48} className="mx-auto mb-2" />
          <p className="text-xs">No data</p>
        </div>
      </div>
    );
  }
  
  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const startAngle = (cumulativePercentage / 100) * 360;
    const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
    cumulativePercentage += percentage;
    
    // Create SVG path for pie segment
    const radius = size / 2 - 10;
    const centerX = size / 2;
    const centerY = size / 2;
    
    const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
    
    const largeArcFlag = percentage > 50 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    // Different shades of gray/black for segments
    const colors = ['#000000', '#374151', '#6B7280', '#9CA3AF'];
    const color = colors[index % colors.length];
    
    return (
      <path
        key={index}
        d={pathData}
        fill={color}
        stroke="white"
        strokeWidth="2"
        className="hover:opacity-80 transition-opacity duration-200"
      />
    );
  });
  
  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        {segments}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-black">{total}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
      </div>
    </div>
  );
};

export default function StatsOverview({ totalAssessments, totalAssignments, totalSubmissions, submissionsData }) {
  const [animatedValues, setAnimatedValues] = useState({
    assessments: 0,
    assignments: 0,
    submissions: 0,
    pending: 0
  });
  
  const [showChart, setShowChart] = useState('pie');
  
  // Animate numbers on mount
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    
    const targets = {
      assessments: totalAssessments || 0,
      assignments: totalAssignments || 0,
      submissions: totalSubmissions || 0,
      pending: (totalAssignments || 0) - (totalSubmissions || 0)
    };
    
    let currentStep = 0;
    
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedValues({
        assessments: Math.round(targets.assessments * easeOut),
        assignments: Math.round(targets.assignments * easeOut),
        submissions: Math.round(targets.submissions * easeOut),
        pending: Math.round(targets.pending * easeOut)
      });
      
      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedValues(targets);
      }
    }, stepDuration);
    
    return () => clearInterval(interval);
  }, [totalAssessments, totalAssignments, totalSubmissions]);
  
  const statsData = [
    { 
      name: 'Assessments', 
      value: animatedValues.assessments, 
      icon: <FileText size={24} />, 
      trend: 'up',
      trendValue: '+12%',
      description: 'Active assessments'
    },
    { 
      name: 'Assignments', 
      value: animatedValues.assignments, 
      icon: <Users size={24} />, 
      trend: 'up',
      trendValue: '+8%',
      description: 'Sent to candidates'
    },
    { 
      name: 'Submissions', 
      value: animatedValues.submissions, 
      icon: <CheckCircle size={24} />, 
      trend: 'up',
      trendValue: '+15%',
      description: 'Completed tests'
    },
    { 
      name: 'Pending', 
      value: animatedValues.pending, 
      icon: <Clock size={24} />, 
      trend: 'down',
      trendValue: '-5%',
      description: 'Awaiting completion'
    },
  ];

  const submissionStatusData = [
    { name: 'Passed', value: submissionsData?.passed || 0 },
    { name: 'Failed', value: submissionsData?.failed || 0 },
    { name: 'In Progress', value: submissionsData?.inProgress || 0 },
  ].filter(item => item.value > 0);

  const chartData = statsData.map(item => ({
    name: item.name,
    value: item.value
  }));

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <ArrowUp size={14} className="text-green-600" />;
      case 'down': return <ArrowDown size={14} className="text-red-600" />;
      default: return <Minus size={14} className="text-gray-400" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return 'text-green-600 bg-green-50';
      case 'down': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((item, index) => (
          <div key={index} className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gray-100 p-3 rounded-xl group-hover:bg-black group-hover:text-white transition-all duration-300">
                {item.icon}
              </div>
              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(item.trend)}`}>
                {getTrendIcon(item.trend)}
                <span className="ml-1">{item.trendValue}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-3xl font-bold text-black group-hover:text-gray-800 transition-colors duration-300">
                {item.value.toLocaleString()}
              </p>
              <p className="text-lg font-semibold text-gray-900">{item.name}</p>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-black h-1 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min((item.value / Math.max(...statsData.map(s => s.value))) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Overview Chart */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-black mb-2">Overview</h3>
              <p className="text-gray-600 text-sm">Assessment metrics breakdown</p>
            </div>
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setShowChart('bar')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  showChart === 'bar' 
                    ? 'bg-white shadow-sm text-black' 
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                <BarChart3 size={16} />
              </button>
              <button
                onClick={() => setShowChart('pie')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  showChart === 'pie' 
                    ? 'bg-white shadow-sm text-black' 
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                <PieChart size={16} />
              </button>
            </div>
          </div>
          
          <div className="h-64 flex items-center justify-center">
            {showChart === 'bar' ? (
              <SimpleBarChart data={chartData} height={200} />
            ) : (
              <SimplePieChart data={chartData} size={200} />
            )}
          </div>
        </div>

        {/* Submission Status */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-black mb-2">Submission Status</h3>
              <p className="text-gray-600 text-sm">Candidate performance overview</p>
            </div>
            <div className="bg-gray-100 p-2 rounded-lg">
              <Activity size={20} className="text-gray-600" />
            </div>
          </div>
          
          <div className="flex items-center justify-center mb-6">
            <SimplePieChart data={submissionStatusData} size={180} />
          </div>
          
          {/* Legend */}
          <div className="space-y-3">
            {submissionStatusData.map((item, index) => {
              const colors = ['bg-black', 'bg-gray-600', 'bg-gray-400'];
              const total = submissionStatusData.reduce((acc, s) => acc + s.value, 0);
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
              
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]}`}></div>
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-black">{item.value}</div>
                    <div className="text-xs text-gray-500">{percentage}%</div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {submissionStatusData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Eye size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No submissions yet</p>
              <p className="text-sm text-gray-400">Data will appear here once candidates start submitting</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Insights */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-8 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-black mb-2">Quick Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-black mb-1">
                  {totalSubmissions > 0 ? Math.round((submissionsData?.passed || 0) / totalSubmissions * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-black mb-1">
                  {totalAssignments > 0 ? Math.round((totalSubmissions / totalAssignments) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-black mb-1">
                  {totalAssessments || 0}
                </div>
                <div className="text-sm text-gray-600">Active Tests</div>
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="w-20 h-20 bg-black bg-opacity-10 rounded-2xl flex items-center justify-center">
              <Target size={32} className="text-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// export default function StatsOverview({ totalAssessments, totalAssignments, totalSubmissions, submissionsData }) {
//   const data = [
//     { name: 'Assessments', value: totalAssessments, icon: <FileText size={16} /> },
//     { name: 'Assignments', value: totalAssignments, icon: <Users size={16} /> },
//     { name: 'Submissions', value: totalSubmissions, icon: <CheckCircle size={16} /> },
//     { name: 'Pending', value: totalAssignments - totalSubmissions, icon: <Clock size={16} /> },
//   ];

//   const submissionStatusData = [
//     { name: 'Passed', value: submissionsData?.passed || 0 },
//     { name: 'Failed', value: submissionsData?.failed || 0 },
//     { name: 'In Progress', value: submissionsData?.inProgress || 0 },
//   ];

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
//       {/* Stats Cards */}
//       <div className="grid grid-cols-2 gap-4">
//         {data.map((item, index) => (
//           <div key={index} className="bg-white p-4 rounded-lg shadow">
//             <div className="flex items-center">
//               <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
//                 {item.icon}
//               </div>
//               <div>
//                 <p className="text-2xl font-bold text-gray-900">{item.value}</p>
//                 <p className="text-sm text-gray-500">{item.name}</p>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Submission Status Chart */}
//       <div className="bg-white p-6 rounded-lg shadow">
//         <h3 className="text-lg font-medium text-gray-900 mb-4">Submission Status</h3>
//         <ResponsiveContainer width="100%" height={200}>
//           <PieChart>
//             <Pie
//               data={submissionStatusData}
//               cx="50%"
//               cy="50%"
//               labelLine={false}
//               label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
//               outerRadius={80}
//               fill="#8884d8"
//               dataKey="value"
//             >
//               {submissionStatusData.map((entry, index) => (
//                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//               ))}
//             </Pie>
//             <Tooltip />
//           </PieChart>
//         </ResponsiveContainer>
//       </div>
//     </div>
//   );
// }