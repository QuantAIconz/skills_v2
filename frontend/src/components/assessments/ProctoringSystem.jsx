// src/components/assessments/ProctoringSystem.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function ProctoringSystem({ 
  assignmentId, 
  config, 
  onViolation,
  onStatusChange 
}) {
  const [violations, setViolations] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const videoRef = useRef(null);
  const screenRef = useRef(null);
  const audioRef = useRef(null);
  const monitoringInterval = useRef(null);
  const violationCheckInterval = useRef(null);

  // Track browser tab changes
  const [isTabActive, setIsTabActive] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  // Track face detection
  const [faceDetected, setFaceDetected] = useState(true);
  const [noFaceCount, setNoFaceCount] = useState(0);

  // Initialize proctoring
  const initializeProctoring = useCallback(async () => {
    try {
      if (config.camera) {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = cameraStream;
        }
      }

      if (config.screen) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true,
          audio: config.microphone
        });
        if (screenRef.current) {
          screenRef.current.srcObject = screenStream;
        }
      }

      if (config.microphone && !config.screen) {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (audioRef.current) {
          audioRef.current.srcObject = audioStream;
        }
      }

      setIsMonitoring(true);
      onStatusChange('monitoring_started');

      // Start monitoring intervals
      startMonitoring();

    } catch (error) {
      console.error('Proctoring initialization failed:', error);
      recordViolation('permission_denied', 'User denied proctoring permissions');
    }
  }, [config, onStatusChange]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    // Check for violations every 5 seconds
    violationCheckInterval.current = setInterval(() => {
      checkForViolations();
    }, 5000);

    // Record proctoring data every 30 seconds
    monitoringInterval.current = setInterval(() => {
      recordProctoringData();
    }, 30000);
  }, []);

  // Check for violations
  const checkForViolations = useCallback(async () => {
    const violations = [];

    // Check tab focus
    if (!isTabActive && config.browserLock) {
      violations.push({
        type: 'tab_switch',
        severity: 'medium',
        message: 'Candidate switched browser tabs',
        timestamp: new Date()
      });
    }

    // Check face detection (simplified)
    if (config.camera && !faceDetected) {
      setNoFaceCount(prev => prev + 1);
      if (noFaceCount > 2) { // After 3 consecutive checks
        violations.push({
          type: 'no_face_detected',
          severity: 'high',
          message: 'No face detected for 15 seconds',
          timestamp: new Date()
        });
      }
    } else {
      setNoFaceCount(0);
    }

    // Check multiple faces (would require proper face detection API)
    // This is a placeholder for actual face detection implementation

    // Check audio (would require audio analysis)
    if (config.microphone) {
      // Placeholder for audio analysis
    }

    // Record violations
    if (violations.length > 0) {
      for (const violation of violations) {
        recordViolation(violation.type, violation.message, violation.severity);
      }
    }
  }, [isTabActive, faceDetected, noFaceCount, config]);

  // Record violation
  const recordViolation = useCallback(async (type, message, severity = 'medium') => {
    const violation = {
      type,
      message,
      severity,
      timestamp: new Date(),
      assignmentId
    };

    setViolations(prev => [...prev, violation]);
    
    // Save to database
    try {
      await addDoc(collection(db, 'proctoring_violations'), violation);
      
      // Update assignment with violation count
      const assignmentRef = doc(db, 'assignments', assignmentId);
      await updateDoc(assignmentRef, {
        violations: violations.length + 1,
        lastViolation: new Date()
      });

      onViolation(violation);
    } catch (error) {
      console.error('Failed to record violation:', error);
    }
  }, [assignmentId, violations.length, onViolation]);

  // Record proctoring data
  const recordProctoringData = useCallback(async () => {
    try {
      const proctoringData = {
        assignmentId,
        timestamp: new Date(),
        violations: violations.length,
        isTabActive,
        faceDetected,
        // Add more data points as needed
      };

      await addDoc(collection(db, 'proctoring_logs'), proctoringData);
    } catch (error) {
      console.error('Failed to record proctoring data:', error);
    }
  }, [assignmentId, violations.length, isTabActive, faceDetected]);

  // Tab visibility change handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isActive = !document.hidden;
      setIsTabActive(isActive);
      
      if (!isActive && config.browserLock) {
        setTabSwitchCount(prev => prev + 1);
        recordViolation('tab_switch', 'Candidate switched browser tabs');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [config.browserLock, recordViolation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitoringInterval.current) {
        clearInterval(monitoringInterval.current);
      }
      if (violationCheckInterval.current) {
        clearInterval(violationCheckInterval.current);
      }
      
      // Stop all media streams
      [videoRef, screenRef, audioRef].forEach(ref => {
        if (ref.current && ref.current.srcObject) {
          ref.current.srcObject.getTracks().forEach(track => track.stop());
        }
      });
    };
  }, []);

  // Initialize proctoring when component mounts
  useEffect(() => {
    if (Object.values(config).some(value => value)) {
      initializeProctoring();
    }
  }, [config, initializeProctoring]);

  return (
    <div className="hidden">
      {/* Hidden media elements for proctoring */}
      {config.camera && <video ref={videoRef} autoPlay muted playsInline className="hidden" />}
      {config.screen && <video ref={screenRef} autoPlay muted playsInline className="hidden" />}
      {config.microphone && !config.screen && <audio ref={audioRef} autoPlay muted className="hidden" />}
      
      {/* Canvas for face detection (would be used with face detection library) */}
      {config.camera && <canvas className="hidden" />}
    </div>
  );
}