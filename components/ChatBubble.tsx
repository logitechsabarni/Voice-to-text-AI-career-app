
import React from 'react';
import { ConversationMessage } from '../types';
import AIResponsePlanDisplay from './AIResponsePlanDisplay'; // Renamed and updated display component
import NextActionsSuggestions from './NextActionsSuggestions';

interface ChatBubbleProps {
  message: ConversationMessage;
  onNextActionClick?: (suggestion: string) => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onNextActionClick }) => {
  const isUser = message.sender === 'user';
  const isAIPlan = message.aiResponsePlan !== undefined;

  const bubbleClasses = `
    p-3 rounded-lg max-w-[80%]
    ${isUser ? 'bg-blue-500 text-white self-end rounded-br-none' : 'bg-gray-200 text-gray-800 self-start rounded-bl-none'}
    ${isAIPlan ? 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200 text-gray-800' : ''}
    ${message.isGeneratingAudio ? 'animate-pulse' : ''}
  `;
  const textClasses = `${message.isStreaming ? 'italic text-gray-600' : ''}`;

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
