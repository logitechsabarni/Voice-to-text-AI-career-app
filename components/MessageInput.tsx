
import React, { useState, useRef, useEffect } from 'react';
import MicrophoneButton from './MicrophoneButton';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isSending: boolean;
  isSpeaking: boolean; // Is AI speaking?
  isRecording: boolean; // Is user recording via mic?
  onToggleRecording: () => void;
  currentSpeechText: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isSending,
  isSpeaking,
  isRecording,
  onToggleRecording,
  currentSpeechText,
}) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // When currentSpeechText updates, set it to input value if recording
    if (isRecording) {
      setInputValue(currentSpeechText);
    } else if (!isSending && !isSpeaking) {
      // Clear input after recording stops and AI is not speaking/sending
      // This ensures we don't clear while a message is being processed
      setInputValue('');
    }
  }, [currentSpeechText, isRecording, isSending, isSpeaking]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  const handleSend = () => {
    const messageToSend = inputValue.trim();
    if (messageToSend && !isSending && !isSpeaking) {
      onSendMessage(messageToSend);
      setInputValue(''); // Clear input after sending
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isInputDisabled = isSending || isSpeaking || isRecording;

  return (
    <div className="flex items-end space-x-2 p-4 bg-white border-t border-gray-200">
      <textarea
        ref={textareaRef}
        className="flex-1 resize-none overflow-hidden rounded-lg border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
        placeholder={isRecording ? "Listening..." : (isSpeaking ? "AI is speaking..." : "Type your goal or question...")}
        rows={1}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isInputDisabled}
        aria-label="Message input"
        aria-describedby={isRecording ? "current-speech-transcription" : undefined}
      />
      <button
        onClick={handleSend}
        disabled={isInputDisabled || inputValue.trim() === ''}
        className={`
          p-3 rounded-full shadow-lg transition-colors duration-200 ease-in-out
          ${inputValue.trim() === '' || isInputDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}
          text-white flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
        `}
        aria-label="Send message"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
        </svg>
      </button>
      <MicrophoneButton
        isRecording={isRecording}
        isSpeaking={isSpeaking || isSending} // Disable mic if AI is speaking or processing
        onClick={onToggleRecording}
        disabled={isSpeaking || isSending}
      />
    </div>
  );
};

export default MessageInput;