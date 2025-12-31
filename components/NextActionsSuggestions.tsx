
import React from 'react';

interface NextActionsSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

const NextActionsSuggestions: React.FC<NextActionsSuggestionsProps> = ({ suggestions, onSuggestionClick }) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2 justify-start">
      {suggestions.map((suggestion, index) => (
        <button
          key={`next-action-${index}`}
          onClick={() => onSuggestionClick(suggestion)}
          className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          aria-label={`Suggest: ${suggestion}`}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

export default NextActionsSuggestions;
