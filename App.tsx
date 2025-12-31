// Add a reference to the 'dom' library to ensure SpeechRecognition types are available.
/// <reference lib="dom" />

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatBubble from './components/ChatBubble';
import MessageInput from './components/MessageInput'; // New input component
import { initializeGeminiChat, sendChatMessage, synthesizeAndPlaySpeech, stopPlayingAudio, resetGeminiChat } from './services/geminiService';
import { ConversationMessage, ActionPlan } from './types';
import { parseActionPlan } from './utils/planParser';
import { Content } from '@google/genai';
import { SYSTEM_INSTRUCTION } from './constants';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false); // Indicates if message is being sent to Gemini
  const [isSpeaking, setIsSpeaking] = useState(false); // Indicates if AI is speaking (playing audio)
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentSpeechText, setCurrentSpeechText] = useState(''); // Text from client-side STT

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);

  // Effect to scroll to the bottom of the chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, currentSpeechText]);

  // Initialize Gemini Chat on component mount
  useEffect(() => {
    initializeGeminiChat();
    return () => {
      stopPlayingAudio();
      resetSpeechRecognition(); // Clean up speech recognition
    };
  }, []);

  // Initialize Speech Recognition API
  const initializeSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech Recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Only get one result per recognition start
    recognition.interimResults = true; // Get interim results for live transcription
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Speech recognition started...');
      setIsRecording(true);
      setCurrentSpeechText('');
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      setCurrentSpeechText(finalTranscript || interimTranscript);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended.');
      setIsRecording(false);
      if (currentSpeechText.trim() !== '') {
        handleSendMessage(currentSpeechText);
      }
      setCurrentSpeechText(''); // Clear after sending or if no final result
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsRecording(false);
      setCurrentSpeechText('');
    };

    speechRecognitionRef.current = recognition;
  }, [currentSpeechText]); // Include currentSpeechText to ensure onend has the latest value

  useEffect(() => {
    initializeSpeechRecognition();
  }, [initializeSpeechRecognition]);

  const resetSpeechRecognition = useCallback(() => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current = null;
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (!speechRecognitionRef.current) {
      setError('Speech Recognition not initialized.');
      return;
    }

    if (isRecording) {
      speechRecognitionRef.current.stop();
    } else {
      stopPlayingAudio(); // Stop AI speaking if user wants to talk
      speechRecognitionRef.current.start();
    }
  }, [isRecording]);


  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isSending || isSpeaking) return;

    setError(null);
    setIsSending(true);

    const userMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: text.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Construct history for Gemini Chat API
    // The history should alternate between 'user' and 'model'
    const chatHistory: Content[] = messages.map(msg => {
      let parts: { text?: string }[] = [];
      if (msg.actionPlan) {
        // If it was an action plan, reconstruct a text representation for context
        parts.push({ text: `AI provided an action plan titled: "${msg.actionPlan.title}"` });
      } else if (msg.text) {
        parts.push({ text: msg.text });
      }
      return { role: msg.sender === 'user' ? 'user' : 'model', parts: parts };
    });

    // Add the current user message to the history for this turn
    chatHistory.push({ role: 'user', parts: [{ text: text.trim() }] });
    // Also include the system instruction as the first message for context
    chatHistory.unshift({ role: 'system', parts: [{ text: SYSTEM_INSTRUCTION }] });


    const geminiMessagePlaceholder: ConversationMessage = {
      id: crypto.randomUUID(),
      sender: 'gemini',
      isStreaming: true,
      text: 'Thinking...',
    };
    setMessages((prev) => [...prev, geminiMessagePlaceholder]);

    try {
      const geminiResponse = await sendChatMessage(text, chatHistory); // Send the message and history
      const responseText = geminiResponse.text || "No response text.";

      let parsedActionPlan: ActionPlan | null = null;
      // Attempt to parse the action plan
      const planResult = parseActionPlan(responseText);
      if (planResult) {
        parsedActionPlan = planResult;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === geminiMessagePlaceholder.id
            ? {
                ...msg,
                text: responseText,
                actionPlan: parsedActionPlan,
                isStreaming: false,
                isGeneratingAudio: true, // Indicate audio generation for this message
              }
            : msg
        )
      );
      setIsSpeaking(true); // Indicate AI is about to speak
      await synthesizeAndPlaySpeech(responseText, {
        onSpeechEnd: () => setIsSpeaking(false),
        onSessionError: (err) => {
          setError(err);
          setIsSpeaking(false);
        },
      });

    } catch (e: any) {
      console.error('Gemini chat error:', e);
      setError(`Gemini error: ${e.message}`);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === geminiMessagePlaceholder.id
            ? { ...msg, text: `Error: ${e.message}`, isStreaming: false }
            : msg
        )
      );
      setIsSpeaking(false); // Stop speaking indicator on error
    } finally {
      setIsSending(false);
    }
  }, [messages, isSending, isSpeaking, initializeSpeechRecognition, currentSpeechText]);


  const handleNextActionClick = useCallback((suggestion: string) => {
    handleSendMessage(suggestion);
  }, [handleSendMessage]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-xl overflow-hidden">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-md flex items-center justify-between">
        <h1 className="text-xl font-bold md:text-2xl">Thought-to-Action AI Agent</h1>
        <div className="flex items-center space-x-2">
          {isSending && (
            <span className="text-sm font-medium animate-pulse">Thinking...</span>
          )}
          {isRecording && (
            <span className="text-sm font-medium animate-pulse">Recording...</span>
          )}
          {isSpeaking && (
            <span className="text-sm font-medium animate-pulse">Speaking...</span>
          )}
          {error && (
            <span className="text-sm text-red-200 font-medium">Error: {error}</span>
          )}
        </div>
      </header>

      <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="mb-2 text-lg">Hello! How can I help you plan today?</p>
            <p className="text-sm">Type or speak your goal to get started!</p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} onNextActionClick={handleNextActionClick} />
        ))}
      </main>

      <footer className="sticky bottom-0 bg-white">
        <MessageInput
          onSendMessage={handleSendMessage}
          isSending={isSending}
          isSpeaking={isSpeaking}
          isRecording={isRecording}
          onToggleRecording={toggleRecording}
          currentSpeechText={currentSpeechText}
        />
      </footer>
    </div>
  );
}

export default App;