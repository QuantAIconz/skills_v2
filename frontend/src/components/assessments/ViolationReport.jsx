// src/components/assessments/ViolationReport.jsx
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { AlertCircle, Loader } from 'lucide-react';

export default function ViolationReport({ assignmentId }) {
  const [violations, setViolations] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!assignmentId) return;

    const q = query(
      collection(db, 'proctoring_violations'),
      where('assignmentId', '==', assignmentId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const violationsData = [];
      querySnapshot.forEach((doc) => {
        violationsData.push({ id: doc.id, ...doc.data() });
      });
      setViolations(violationsData);
    });

    return unsubscribe;
  }, [assignmentId]);

  const generateAIReport = async () => {
    setLoading(true);
    setError('');
    
    try {
      // const response = await fetch('http://localhost:5001/generate-violation-report', {
      const response = await fetch('https://skills-v2.onrender.com/generate-violation-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId,
          violations
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const reportData = await response.json();
      
      if (reportData.error) {
        throw new Error(reportData.error);
      }
      
      setReport(reportData);
    } catch (err) {
      console.error('Error generating AI report:', err);
      setError(err.message);
      // Fallback to simple report
      setReport(generateFallbackReport(violations));
    }
    
    setLoading(false);
  };

  const generateFallbackReport = (violations) => {
    const severityCount = {
      low: violations.filter(v => v.severity === 'low').length,
      medium: violations.filter(v => v.severity === 'medium').length,
      high: violations.filter(v => v.severity === 'high').length
    };

    return {
      summary: `Found ${violations.length} violations during assessment`,
      severityBreakdown: severityCount,
      recommendations: violations.length > 0 ? [
        'Review the assessment for potential cheating',
        'Consider additional verification for this candidate'
      ] : [
        'No significant violations detected',
        'Assessment appears to have been completed under normal conditions'
      ],
      confidence: violations.length > 0 ? 'medium' : 'high'
    };
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mt-4">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Proctoring Report</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Detected {violations.length} violation{violations.length !== 1 ? 's' : ''} during this assessment
        </p>
      </div>

      {violations.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Violations:</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {violations.map((violation, index) => (
              <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  violation.severity === 'high' ? 'bg-red-500' :
                  violation.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{violation.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(violation.timestamp?.toDate?.() || violation.timestamp).toLocaleString()}
                    {violation.severity && ` • ${violation.severity} severity`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={generateAIReport}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 flex items-center"
      >
        {loading ? (
          <>
            <Loader size={16} className="mr-2 animate-spin" />
            Generating Report...
          </>
        ) : (
          'Generate AI Report'
        )}
      </button>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle size={16} className="text-red-600 mr-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {report && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">AI Analysis:</h4>
          <p className="text-sm text-gray-700 mb-2">{report.summary}</p>
          
          <div className="mb-3">
            <p className="text-sm font-medium">Severity Breakdown:</p>
            <div className="flex space-x-4 mt-1">
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Low: {report.severityBreakdown.low}
              </span>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Medium: {report.severityBreakdown.medium}
              </span>
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                High: {report.severityBreakdown.high}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Recommendations:</p>
            <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
              {report.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            Confidence: {report.confidence}
          </div>
        </div>
      )}
    </div>
  );
}












// // src/components/assessments/ViolationReport.jsx
// import { useState, useEffect } from 'react';
// import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
// import { db } from '../../services/firebase';
// import { AlertCircle, Loader, Camera, Mic, Monitor, Globe, Shield } from 'lucide-react';

// const VIOLATION_TYPES = {
//   camera: { icon: Camera, label: 'Camera Violation', color: 'red' },
//   microphone: { icon: Mic, label: 'Microphone Violation', color: 'blue' },
//   screen: { icon: Monitor, label: 'Screen Violation', color: 'purple' },
//   browser: { icon: Shield, label: 'Browser Violation', color: 'orange' },
//   network: { icon: Globe, label: 'Network Violation', color: 'green' },
//   behavior: { icon: Shield, label: 'Behavior Violation', color: 'indigo' }
// };

// export default function ViolationReport({ assignmentId }) {
//   const [violations, setViolations] = useState([]);
//   const [report, setReport] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [activeTab, setActiveTab] = useState('all');

//   useEffect(() => {
//     if (!assignmentId) return;

//     const q = query(
//       collection(db, 'proctoring_violations'),
//       where('assignmentId', '==', assignmentId),
//       orderBy('timestamp', 'desc')
//     );

//     const unsubscribe = onSnapshot(q, (querySnapshot) => {
//       const violationsData = [];
//       querySnapshot.forEach((doc) => {
//         violationsData.push({ id: doc.id, ...doc.data() });
//       });
//       setViolations(violationsData);
//     });

//     return unsubscribe;
//   }, [assignmentId]);

//   const filteredViolations = violations.filter(violation => 
//     activeTab === 'all' || violation.type === activeTab
//   );

//   const generateAIReport = async () => {
//     setLoading(true);
//     setError('');
    
//     try {
//       const response = await fetch('http://localhost:5001/generate-violation-report', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           assignmentId,
//           violations
//         })
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to generate report');
//       }

//       const reportData = await response.json();
      
//       if (reportData.error) {
//         throw new Error(reportData.error);
//       }
      
//       setReport(reportData);
//     } catch (err) {
//       console.error('Error generating AI report:', err);
//       setError(err.message);
//       setReport(generateFallbackReport(violations));
//     }
    
//     setLoading(false);
//   };

//   const generateFallbackReport = (violations) => {
//     const severityCount = {
//       low: violations.filter(v => v.severity === 'low').length,
//       medium: violations.filter(v => v.severity === 'medium').length,
//       high: violations.filter(v => v.severity === 'high').length
//     };

//     const typeCount = violations.reduce((acc, violation) => {
//       acc[violation.type] = (acc[violation.type] || 0) + 1;
//       return acc;
//     }, {});

//     return {
//       summary: `Found ${violations.length} violations during assessment`,
//       severityBreakdown: severityCount,
//       typeBreakdown: typeCount,
//       recommendations: violations.length > 0 ? [
//         'Review the assessment for potential cheating',
//         'Consider additional verification for this candidate',
//         'Check the detailed violation timeline for patterns'
//       ] : [
//         'No significant violations detected',
//         'Assessment appears to have been completed under normal conditions'
//       ],
//       confidence: violations.length > 0 ? 'medium' : 'high'
//     };
//   };

//   const getViolationIcon = (type) => {
//     const violationType = VIOLATION_TYPES[type] || VIOLATION_TYPES.behavior;
//     const IconComponent = violationType.icon;
//     return <IconComponent size={16} className={`text-${violationType.color}-500`} />;
//   };

//   const formatValue = (value) => {
//     if (typeof value === 'object') return JSON.stringify(value, null, 2);
//     return value;
//   };

//   return (
//     <div className="bg-white p-4 rounded-lg shadow mt-4">
//       <h3 className="text-lg font-medium text-gray-900 mb-3">Proctoring Report</h3>
      
//       <div className="mb-4">
//         <p className="text-sm text-gray-600">
//           Detected {violations.length} violation{violations.length !== 1 ? 's' : ''} during this assessment
//         </p>
//       </div>

//       {violations.length > 0 && (
//         <>
//           {/* Tab Navigation */}
//           <div className="mb-4 border-b border-gray-200">
//             <nav className="-mb-px flex space-x-8">
//               <button
//                 onClick={() => setActiveTab('all')}
//                 className={`py-2 px-1 border-b-2 font-medium text-sm ${
//                   activeTab === 'all'
//                     ? 'border-blue-500 text-blue-600'
//                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                 }`}
//               >
//                 All Violations
//               </button>
//               {Object.entries(VIOLATION_TYPES).map(([key, { label }]) => (
//                 <button
//                   key={key}
//                   onClick={() => setActiveTab(key)}
//                   className={`py-2 px-1 border-b-2 font-medium text-sm ${
//                     activeTab === key
//                       ? 'border-blue-500 text-blue-600'
//                       : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                   }`}
//                 >
//                   {label}
//                 </button>
//               ))}
//             </nav>
//           </div>

//           {/* Violations List */}
//           <div className="mb-4">
//             <h4 className="font-medium text-gray-900 mb-2">Violations:</h4>
//             <div className="space-y-2 max-h-60 overflow-y-auto">
//               {filteredViolations.map((violation, index) => (
//                 <div key={index} className="p-3 bg-gray-50 rounded-lg">
//                   <div className="flex items-start justify-between">
//                     <div className="flex items-start space-x-2 flex-1">
//                       {getViolationIcon(violation.type)}
//                       <div className="flex-1">
//                         <p className="text-sm font-medium">{violation.message}</p>
//                         <p className="text-xs text-gray-500">
//                           {new Date(violation.timestamp?.toDate?.() || violation.timestamp).toLocaleString()}
//                           {violation.severity && ` • ${violation.severity} severity`}
//                         </p>
//                         {violation.metadata && (
//                           <div className="mt-2 text-xs bg-white p-2 rounded border">
//                             <strong>Details:</strong>
//                             <pre className="text-xs mt-1 whitespace-pre-wrap">
//                               {formatValue(violation.metadata)}
//                             </pre>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                     <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
//                       violation.severity === 'high' ? 'bg-red-500' :
//                       violation.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
//                     }`}></div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </>
//       )}

//       <button
//         onClick={generateAIReport}
//         disabled={loading}
//         className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 flex items-center"
//       >
//         {loading ? (
//           <>
//             <Loader size={16} className="mr-2 animate-spin" />
//             Generating Report...
//           </>
//         ) : (
//           'Generate AI Report'
//         )}
//       </button>

//       {error && (
//         <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
//           <div className="flex items-center">
//             <AlertCircle size={16} className="text-red-600 mr-2" />
//             <p className="text-sm text-red-600">{error}</p>
//           </div>
//         </div>
//       )}

//       {report && (
//         <div className="mt-4 p-4 bg-gray-50 rounded-lg">
//           <h4 className="font-medium text-gray-900 mb-2">AI Analysis:</h4>
//           <p className="text-sm text-gray-700 mb-2">{report.summary}</p>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
//             <div>
//               <p className="text-sm font-medium">Severity Breakdown:</p>
//               <div className="flex flex-col space-y-2 mt-1">
//                 <div className="flex items-center justify-between text-xs">
//                   <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Low</span>
//                   <span>{report.severityBreakdown.low}</span>
//                 </div>
//                 <div className="flex items-center justify-between text-xs">
//                   <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Medium</span>
//                   <span>{report.severityBreakdown.medium}</span>
//                 </div>
//                 <div className="flex items-center justify-between text-xs">
//                   <span className="bg-red-100 text-red-800 px-2 py-1 rounded">High</span>
//                   <span>{report.severityBreakdown.high}</span>
//                 </div>
//               </div>
//             </div>

//             {report.typeBreakdown && (
//               <div>
//                 <p className="text-sm font-medium">Type Breakdown:</p>
//                 <div className="space-y-1 mt-1">
//                   {Object.entries(report.typeBreakdown).map(([type, count]) => (
//                     <div key={type} className="flex items-center justify-between text-xs">
//                       <span className="capitalize">{type}</span>
//                       <span>{count}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>

//           <div>
//             <p className="text-sm font-medium">Recommendations:</p>
//             <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
//               {report.recommendations.map((rec, index) => (
//                 <li key={index}>{rec}</li>
//               ))}
//             </ul>
//           </div>

//           <div className="mt-3 text-xs text-gray-500">
//             Confidence: {report.confidence}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }