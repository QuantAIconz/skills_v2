// src/components/assessments/AssessmentForm.jsx
import { useState, useEffect } from 'react';

const QUESTION_TYPES = [
  { id: 'multiple_choice', name: 'Multiple Choice', icon: '📝', description: 'Multiple choice questions with options' },
  { id: 'coding', name: 'Coding Challenge', icon: '💻', description: 'Coding problems with test cases' },
  { id: 'text', name: 'Text Response', icon: '📄', description: 'Open-ended text responses' },
  { id: 'full_stack', name: 'Full-Stack Project', icon: '🌐', description: 'Comprehensive full-stack projects' }
];

const DIFFICULTY_LEVELS = [
  { id: 'beginner', name: 'Beginner' },
  { id: 'intermediate', name: 'Intermediate' },
  { id: 'advanced', name: 'Advanced' }
];

export default function AssessmentForm({ 
  onGenerateWithAI, 
  onSave, 
  loading, 
  aiEnabled = true,
  initialData = null 
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    jobRole: '',
    type: 'multiple_choice',
    difficulty: 'intermediate',
    numberOfQuestions: 5,
    timeLimit: 30,
    passingScore: 70,
    proctoring: {
      camera: false,
      screen: false,
      microphone: false,
      browserLock: false,
      ipTracking: false
    }
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        jobRole: initialData.jobRole || '',
        type: initialData.type || 'multiple_choice',
        difficulty: initialData.difficulty || 'intermediate',
        numberOfQuestions: initialData.numberOfQuestions || 5,
        timeLimit: initialData.timeLimit || 30,
        passingScore: initialData.passingScore || 70,
        proctoring: {
          camera: initialData.proctoring?.camera || false,
          screen: initialData.proctoring?.screen || false,
          microphone: initialData.proctoring?.microphone || false,
          browserLock: initialData.proctoring?.browserLock || false,
          ipTracking: initialData.proctoring?.ipTracking || false
        }
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      const [parent, key] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [key]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) || 0 : value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title.trim()) {
      alert('Please enter an assessment title');
      return;
    }
    
    if (!formData.jobRole.trim()) {
      alert('Please enter a job role');
      return;
    }
    
    if (formData.numberOfQuestions < 1 || formData.numberOfQuestions > 50) {
      alert('Number of questions must be between 1 and 50');
      return;
    }
    
    if (formData.timeLimit < 5 || formData.timeLimit > 300) {
      alert('Time limit must be between 5 and 300 minutes');
      return;
    }
    
    if (formData.passingScore < 0 || formData.passingScore > 100) {
      alert('Passing score must be between 0 and 100');
      return;
    }
    
    onSave(formData);
  };

  const handleGenerateAI = () => {
    if (!formData.jobRole.trim()) {
      alert('Please enter a job role before generating with AI');
      return;
    }
    
    onGenerateWithAI(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      {/* AI Status Indicator */}
      {aiEnabled !== undefined && (
        <div className={`p-3 rounded-md ${aiEnabled ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
          <div className="flex items-center">
            <span className="text-sm">
              {aiEnabled ? '✅ AI generation is available' : '⚠️ AI generation unavailable - using fallback questions'}
            </span>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Assessment Title *
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Frontend Developer Skills Test"
          />
        </div>

        <div>
          <label htmlFor="jobRole" className="block text-sm font-medium text-gray-700 mb-1">
            Job Role *
          </label>
          <input
            type="text"
            name="jobRole"
            id="jobRole"
            required
            value={formData.jobRole}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Frontend Developer, Data Scientist"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          id="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe the purpose and scope of this assessment..."
        />
      </div>

      {/* Question Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Question Type</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUESTION_TYPES.map(type => (
            <div
              key={type.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                formData.type === type.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
            >
              <div className="text-2xl mb-2">{type.icon}</div>
              <h3 className="font-medium text-gray-900">{type.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{type.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Assessment Settings */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
            Difficulty Level
          </label>
          <select
            name="difficulty"
            id="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {DIFFICULTY_LEVELS.map(level => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="numberOfQuestions" className="block text-sm font-medium text-gray-700 mb-1">
            Number of Questions
          </label>
          <input
            type="number"
            name="numberOfQuestions"
            id="numberOfQuestions"
            min="1"
            max="50"
            value={formData.numberOfQuestions}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 mb-1">
            Time Limit (minutes)
          </label>
          <input
            type="number"
            name="timeLimit"
            id="timeLimit"
            min="5"
            max="300"
            value={formData.timeLimit}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="passingScore" className="block text-sm font-medium text-gray-700 mb-1">
          Passing Score (%)
        </label>
        <input
          type="number"
          name="passingScore"
          id="passingScore"
          min="0"
          max="100"
          value={formData.passingScore}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Proctoring Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Proctoring Settings</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { id: 'camera', label: 'Camera Recording', description: 'Record candidate\'s camera during assessment' },
            { id: 'screen', label: 'Screen Recording', description: 'Record candidate\'s screen during assessment' },
            { id: 'microphone', label: 'Microphone Access', description: 'Monitor audio during assessment' },
            { id: 'browserLock', label: 'Browser Lock', description: 'Prevent switching tabs or applications' },
            { id: 'ipTracking', label: 'IP Tracking', description: 'Track and verify candidate\'s IP address' }
          ].map(setting => (
            <div key={setting.id} className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id={`proctoring.${setting.id}`}
                  name={`proctoring.${setting.id}`}
                  type="checkbox"
                  checked={formData.proctoring[setting.id]}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor={`proctoring.${setting.id}`} className="font-medium text-gray-700">
                  {setting.label}
                </label>
                <p className="text-gray-500">{setting.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={handleGenerateAI}
          disabled={loading || !aiEnabled}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate with AI'}
        </button>
        
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Assessment'}
          </button>
        </div>
      </div>
    </form>
  );
}



// // src/components/assessments/AssessmentForm.jsx
// import { useState, useEffect, useRef } from 'react';
// import { doc, setDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
// import { db } from '../../services/firebase';
// import { 
//   Camera, 
//   Mic, 
//   Monitor, 
//   Globe, 
//   Lock, 
//   Shield,
//   AlertTriangle,
//   Info,
//   Save,
//   X
// } from 'lucide-react';

// export default function AssessmentForm({ 
//   onGenerateWithAI, 
//   onSave, 
//   loading, 
//   aiEnabled = true,
//   initialData = null 
// }) {
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     jobRole: '',
//     type: 'multiple_choice',
//     difficulty: 'intermediate',
//     numberOfQuestions: 5,
//     timeLimit: 30,
//     passingScore: 70,
//     proctoring: {
//       camera: false,
//       microphone: false,
//       screen: false,
//       browserLock: false,
//       ipTracking: false,
//       behaviorAnalytics: false,
//       requireCamera: true,
//       requireMicrophone: false,
//       recordEntireSession: false,
//       enableLiveProctoring: false,
//       violationThreshold: 3,
//       allowedResources: []
//     }
//   });

//   const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
//   const [permissionStatus, setPermissionStatus] = useState({
//     camera: 'pending',
//     microphone: 'pending',
//     screen: 'pending'
//   });

//   // Test device permissions
//   useEffect(() => {
//     const testPermissions = async () => {
//       const status = { ...permissionStatus };
      
//       try {
//         // Test camera permission
//         const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
//         cameraStream.getTracks().forEach(track => track.stop());
//         status.camera = 'granted';
//       } catch (error) {
//         status.camera = 'denied';
//       }
      
//       try {
//         // Test microphone permission
//         const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
//         micStream.getTracks().forEach(track => track.stop());
//         status.microphone = 'granted';
//       } catch (error) {
//         status.microphone = 'denied';
//       }
      
//       // Test screen share (only available in secure contexts)
//       if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
//         status.screen = 'available';
//       } else {
//         status.screen = 'unavailable';
//       }
      
//       setPermissionStatus(status);
//     };

//     testPermissions();
//   }, []);

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
    
//     if (name.startsWith('proctoring.')) {
//       const field = name.split('.')[1];
//       setFormData(prev => ({
//         ...prev,
//         proctoring: {
//           ...prev.proctoring,
//           [field]: type === 'checkbox' ? checked : value
//         }
//       }));
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         [name]: type === 'number' ? parseInt(value) || 0 : value
//       }));
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
    
//     // Validate form
//     if (!formData.title.trim()) {
//       alert('Please enter an assessment title');
//       return;
//     }
    
//     if (!formData.jobRole.trim()) {
//       alert('Please enter a job role');
//       return;
//     }
    
//     // Validate proctoring settings
//     if (formData.proctoring.camera && permissionStatus.camera === 'denied') {
//       alert('Camera access is required but not granted. Please enable camera permissions.');
//       return;
//     }
    
//     if (formData.proctoring.microphone && permissionStatus.microphone === 'denied') {
//       alert('Microphone access is required but not granted. Please enable microphone permissions.');
//       return;
//     }
    
//     onSave(formData);
//   };

//   const ProctoringFeature = ({ id, label, description, icon: Icon, requiresPermission }) => {
//     const permission = permissionStatus[id];
//     const isEnabled = formData.proctoring[id];
//     const hasPermissionIssue = requiresPermission && permission === 'denied' && isEnabled;
    
//     return (
//       <div className={`flex items-start p-4 border rounded-lg transition-colors ${
//         hasPermissionIssue ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:bg-gray-50'
//       }`}>
//         <div className="flex items-center h-5 mt-0.5">
//           <input
//             id={`proctoring.${id}`}
//             name={`proctoring.${id}`}
//             type="checkbox"
//             checked={isEnabled}
//             onChange={handleChange}
//             disabled={requiresPermission && permission === 'denied'}
//             className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//           />
//         </div>
//         <div className="ml-3 flex-1">
//           <div className="flex items-center mb-1">
//             <Icon size={16} className="text-gray-600 mr-2" />
//             <label htmlFor={`proctoring.${id}`} className="font-medium text-gray-900">
//               {label}
//             </label>
//             {requiresPermission && (
//               <span className={`ml-2 text-xs px-2 py-1 rounded ${
//                 permission === 'granted' ? 'bg-green-100 text-green-800' :
//                 permission === 'denied' ? 'bg-red-100 text-red-800' :
//                 'bg-yellow-100 text-yellow-800'
//               }`}>
//                 {permission === 'granted' ? 'Ready' : 
//                  permission === 'denied' ? 'Permission needed' : 'Checking...'}
//               </span>
//             )}
//           </div>
//           <p className="text-sm text-gray-500">{description}</p>
//           {hasPermissionIssue && (
//             <p className="text-xs text-red-600 mt-1">
//               Permission denied. Please enable {id} access in your browser settings.
//             </p>
//           )}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
//       {/* Basic Information */}
//       <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
//         <div>
//           <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
//             Assessment Title *
//           </label>
//           <input
//             type="text"
//             name="title"
//             id="title"
//             required
//             value={formData.title}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             placeholder="e.g., Frontend Developer Skills Test"
//           />
//         </div>

//         <div>
//           <label htmlFor="jobRole" className="block text-sm font-medium text-gray-700 mb-1">
//             Job Role *
//           </label>
//           <input
//             type="text"
//             name="jobRole"
//             id="jobRole"
//             required
//             value={formData.jobRole}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             placeholder="e.g., Frontend Developer, Data Scientist"
//           />
//         </div>
//       </div>

//       {/* Proctoring Settings */}
//       <div className="border-t pt-6">
//         <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
//           <Shield size={20} className="mr-2 text-blue-600" />
//           Proctoring & Security Settings
//         </h3>
        
//         <div className="bg-blue-50 p-4 rounded-lg mb-6">
//           <div className="flex items-start">
//             <Info size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
//             <p className="text-sm text-blue-700">
//               These settings help maintain assessment integrity by monitoring candidate behavior and preventing cheating attempts.
//             </p>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 gap-4">
//           <ProctoringFeature
//             id="camera"
//             label="Camera Monitoring"
//             description="Continuous camera recording with face detection"
//             icon={Camera}
//             requiresPermission={true}
//           />
          
//           <ProctoringFeature
//             id="microphone"
//             label="Microphone Monitoring"
//             description="Audio recording and background noise detection"
//             icon={Mic}
//             requiresPermission={true}
//           />
          
//           <ProctoringFeature
//             id="screen"
//             label="Screen Recording"
//             description="Full screen recording with activity monitoring"
//             icon={Monitor}
//             requiresPermission={true}
//           />
          
//           <ProctoringFeature
//             id="browserLock"
//             label="Browser Lockdown"
//             description="Prevents tab switching, downloads, and right-click"
//             icon={Lock}
//             requiresPermission={false}
//           />
          
//           <ProctoringFeature
//             id="ipTracking"
//             label="IP & Location Tracking"
//             description="Tracks IP address and detects location changes"
//             icon={Globe}
//             requiresPermission={false}
//           />
          
//           <ProctoringFeature
//             id="behaviorAnalytics"
//             label="Behavior Analytics"
//             description="AI-powered behavior pattern analysis"
//             icon={Shield}
//             requiresPermission={false}
//           />
//         </div>

//         {/* Advanced Settings */}
//         <div className="mt-6">
//           <button
//             type="button"
//             onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
//             className="flex items-center text-sm text-blue-600 hover:text-blue-800"
//           >
//             {showAdvancedSettings ? 'Hide' : 'Show'} Advanced Settings
//             <svg className={`ml-1 h-4 w-4 transform ${showAdvancedSettings ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//             </svg>
//           </button>

//           {showAdvancedSettings && (
//             <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
//               <h4 className="font-medium text-gray-900">Advanced Proctoring Configuration</h4>
              
//               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                 <div className="flex items-center">
//                   <input
//                     id="proctoring.requireCamera"
//                     name="proctoring.requireCamera"
//                     type="checkbox"
//                     checked={formData.proctoring.requireCamera}
//                     onChange={handleChange}
//                     disabled={!formData.proctoring.camera}
//                     className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//                   />
//                   <label htmlFor="proctoring.requireCamera" className="ml-2 text-sm text-gray-900">
//                     Require Camera (Mandatory)
//                   </label>
//                 </div>

//                 <div className="flex items-center">
//                   <input
//                     id="proctoring.requireMicrophone"
//                     name="proctoring.requireMicrophone"
//                     type="checkbox"
//                     checked={formData.proctoring.requireMicrophone}
//                     onChange={handleChange}
//                     disabled={!formData.proctoring.microphone}
//                     className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//                   />
//                   <label htmlFor="proctoring.requireMicrophone" className="ml-2 text-sm text-gray-900">
//                     Require Microphone
//                   </label>
//                 </div>

//                 <div className="flex items-center">
//                   <input
//                     id="proctoring.recordEntireSession"
//                     name="proctoring.recordEntireSession"
//                     type="checkbox"
//                     checked={formData.proctoring.recordEntireSession}
//                     onChange={handleChange}
//                     className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//                   />
//                   <label htmlFor="proctoring.recordEntireSession" className="ml-2 text-sm text-gray-900">
//                     Record Entire Session
//                   </label>
//                 </div>

//                 <div className="flex items-center">
//                   <input
//                     id="proctoring.enableLiveProctoring"
//                     name="proctoring.enableLiveProctoring"
//                     type="checkbox"
//                     checked={formData.proctoring.enableLiveProctoring}
//                     onChange={handleChange}
//                     className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//                   />
//                   <label htmlFor="proctoring.enableLiveProctoring" className="ml-2 text-sm text-gray-900">
//                     Enable Live Proctoring
//                   </label>
//                 </div>
//               </div>

//               <div>
//                 <label htmlFor="proctoring.violationThreshold" className="block text-sm font-medium text-gray-700 mb-1">
//                   Violation Threshold (Auto-flag)
//                 </label>
//                 <input
//                   type="range"
//                   name="proctoring.violationThreshold"
//                   id="proctoring.violationThreshold"
//                   min="1"
//                   max="10"
//                   value={formData.proctoring.violationThreshold}
//                   onChange={handleChange}
//                   className="w-full"
//                 />
//                 <div className="flex justify-between text-xs text-gray-500">
//                   <span>1 (Low)</span>
//                   <span>{formData.proctoring.violationThreshold} violations</span>
//                   <span>10 (High)</span>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Action Buttons */}
//       <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
//         <button
//           type="button"
//           onClick={() => window.history.back()}
//           className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
//         >
//           Cancel
//         </button>
//         <button
//           type="submit"
//           disabled={loading}
//           className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
//         >
//           <Save size={16} className="mr-2" />
//           {loading ? 'Saving...' : 'Save Assessment'}
//         </button>
//       </div>
//     </form>
//   );
// }