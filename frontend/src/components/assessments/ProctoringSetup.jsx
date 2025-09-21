// src/components/assessments/ProctoringSetup.jsx
import { useState } from 'react';

export default function ProctoringSetup({ config, onGranted, assessmentTitle }) {
  const [cameraGranted, setCameraGranted] = useState(false);
  const [screenGranted, setScreenGranted] = useState(false);
  const [microphoneGranted, setMicrophoneGranted] = useState(false);
  const [browserLockAccepted, setBrowserLockAccepted] = useState(false);
  const [ipTrackingAccepted, setIpTrackingAccepted] = useState(false);

  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraGranted(true);
    } catch (err) {
      alert('Camera access is required to continue with this assessment.');
    }
  };

  const requestScreenAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setScreenGranted(true);
    } catch (err) {
      alert('Screen sharing access is required to continue with this assessment.');
    }
  };

  const requestMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicrophoneGranted(true);
    } catch (err) {
      alert('Microphone access is required to continue with this assessment.');
    }
  };

  const allPermissionsGranted = () => {
    return (
      (!config.camera || cameraGranted) &&
      (!config.screen || screenGranted) &&
      (!config.microphone || microphoneGranted) &&
      (!config.browserLock || browserLockAccepted) &&
      (!config.ipTracking || ipTrackingAccepted)
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Assessment: {assessmentTitle}</h1>
        <p className="text-gray-600 mb-6">
          Before you begin, please grant the necessary permissions for proctoring as configured by the assessment administrator.
        </p>

        <div className="space-y-6">
          {config.camera && (
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Camera Access</h3>
                <p className="text-sm text-gray-500">Your camera will be recorded during the assessment</p>
              </div>
              <button
                onClick={requestCameraAccess}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  cameraGranted 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                disabled={cameraGranted}
              >
                {cameraGranted ? 'Granted' : 'Allow Camera'}
              </button>
            </div>
          )}

          {config.screen && (
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Screen Sharing</h3>
                <p className="text-sm text-gray-500">Your screen will be recorded during the assessment</p>
              </div>
              <button
                onClick={requestScreenAccess}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  screenGranted 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                disabled={screenGranted}
              >
                {screenGranted ? 'Granted' : 'Allow Screen Share'}
              </button>
            </div>
          )}

          {config.microphone && (
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Microphone Access</h3>
                <p className="text-sm text-gray-500">Your microphone will be active during the assessment</p>
              </div>
              <button
                onClick={requestMicrophoneAccess}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  microphoneGranted 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                disabled={microphoneGranted}
              >
                {microphoneGranted ? 'Granted' : 'Allow Microphone'}
              </button>
            </div>
          )}

          {config.browserLock && (
            <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Browser Lock</h3>
                <p className="text-sm text-gray-500">
                  You won't be able to switch tabs or applications during the assessment. 
                  Any attempt to do so will be recorded and may invalidate your results.
                </p>
              </div>
              <div className="ml-4 flex items-center h-5">
                <input
                  id="browser-lock"
                  name="browser-lock"
                  type="checkbox"
                  checked={browserLockAccepted}
                  onChange={() => setBrowserLockAccepted(!browserLockAccepted)}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
            </div>
          )}

          {config.ipTracking && (
            <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">IP Address Tracking</h3>
                <p className="text-sm text-gray-500">
                  Your IP address will be recorded for security purposes to ensure assessment integrity.
                </p>
              </div>
              <div className="ml-4 flex items-center h-5">
                <input
                  id="ip-tracking"
                  name="ip-tracking"
                  type="checkbox"
                  checked={ipTrackingAccepted}
                  onChange={() => setIpTrackingAccepted(!ipTrackingAccepted)}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onGranted}
            disabled={!allPermissionsGranted()}
            className={`px-6 py-2 rounded-md text-sm font-medium ${
              allPermissionsGranted() 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Start Assessment
          </button>
        </div>
      </div>
    </div>
  );
}