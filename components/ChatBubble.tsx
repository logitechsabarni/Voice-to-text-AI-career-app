
import React from 'react';
import { ConversationMessage } from '../types';
import AIResponsePlanDisplay from './AIResponsePlanDisplay';
import NextActionsSuggestions from './NextActionsSuggestions';

interface ChatBubbleProps {
  message: ConversationMessage;
  onNextActionClick?: (suggestion: string) => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onNextActionClick }) => {
  const isUser = message.sender === 'user';
  const isAIPlan = message.aiResponsePlan !== undefined;

  const bubbleClasses = `
    p-3 rounded-lg max-w-[80%] relative
    ${isUser ? 'bg-blue-500 text-white self-end rounded-br-none' : 'bg-gray-200 text-gray-800 self-start rounded-bl-none'}
    ${isAIPlan ? 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200 text-gray-800' : ''}
    ${message.isGeneratingAudio ? 'animate-pulse' : ''}
    animate-fade-in-up
  `;
  const textClasses = `${message.isStreaming ? 'italic text-gray-600' : ''}`;

  const handleCopyClick = () => {
    if (message.rawResponseText) {
      navigator.clipboard.writeText(message.rawResponseText)
        .then(() => console.log('Response copied to clipboard!'))
        .catch(err => console.error('Failed to copy response:', err));
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={bubbleClasses}>
        {isAIPlan && message.aiResponsePlan ? (
          <>
            <AIResponsePlanDisplay plan={message.aiResponsePlan} />
            {onNextActionClick && message.aiResponsePlan.nextInteractionOptions && message.aiResponsePlan.nextInteractionOptions.length > 0 && (
              <NextActionsSuggestions
                suggestions={message.aiResponsePlan.nextInteractionOptions}
                onSuggestionClick={onNextActionClick}
              />
            )}
            {!isUser && message.rawResponseText && (
              <button
                onClick={handleCopyClick}
                className="absolute top-1 right-1 p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-full"
                aria-label="Copy AI response"
                title="Copy AI response"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-4 5h-4"></path>
                </svg>
              </button>
            )}
          </>
        ) : (
          <p className={textClasses}>
            {message.text}
            {message.isStreaming && <span className="animate-pulse">...</span>}
            {message.isGeneratingAudio && !message.isStreaming && <span className="ml-2 animate-pulse text-sm">🔊</span>}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;