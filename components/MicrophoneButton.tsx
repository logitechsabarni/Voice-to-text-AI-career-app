
import React from 'react';

interface MicrophoneButtonProps {
  isRecording: boolean;
  isSpeaking: boolean;
  onClick: () => void;
  disabled: boolean;
}

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({ isRecording, isSpeaking, onClick, disabled }) => {
  const buttonClasses = `
    p-3 rounded-full shadow-lg transition-all duration-200 ease-in-out
    ${isRecording
      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
      : 'bg-blue-500 hover:bg-blue-600 text-white'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    focus:outline-none focus:ring-2 focus:ring-offset-2
    ${isRecording ? 'focus:ring-red-500' : 'focus:ring-blue-500'}
    flex items-center justify-center
  `;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      title={isRecording ? 'Stop recording' : 'Start recording'}
    >
      {isSpeaking ? (
        <svg className="w-6 h-6 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"></path>
        </svg>
      ) : (
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"></path>
        </svg>
      )}
    </button>
  );
};

export default MicrophoneButton;