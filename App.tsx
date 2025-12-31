
// Add a reference to the 'dom' library to ensure SpeechRecognition types are available.
/// <reference lib="dom" />

// Fix: Add declare global block for SpeechRecognition types to resolve TypeScript errors
declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
      prototype: SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
      prototype: SpeechRecognition;
    };
  }

  interface SpeechRecognition extends EventTarget {
    grammars: SpeechGrammarList;
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    serviceURI: string;

    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;

    start(): void;
    stop(): void;
    abort(): void;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: SpeechRecognitionErrorCode;
    readonly message: string;
  }

  // Minimal stubs for types used by SpeechRecognition and SpeechRecognitionEvent
  interface SpeechGrammarList {}
  interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    length: number;
    item(index: number): SpeechRecognitionResult;
  }
  interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
  }
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }
  type SpeechRecognitionErrorCode =
    | 'no-speech'
    | 'aborted'
    | 'audio-capture'
    | 'network'
    | 'not-allowed'
    | 'service-not-allowed'
    | 'bad-grammar'
    | 'language-not-supported';
}


import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatBubble from './components/ChatBubble';
import MessageInput from './components/MessageInput';
import { initializeGeminiChat, sendChatMessage, synthesizeAndPlaySpeech, stopPlayingAudio, resetGeminiChat } from './services/geminiService';
import { ConversationMessage, AIResponsePlan, ConversationState } from './types';
import { parseAIResponsePlan } from './utils/planParser';
import { Content } from '@google/genai';
import { SYSTEM_INSTRUCTION, INITIAL_CONVERSATION_STATE } from './constants';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false); // Indicates if message is being sent to Gemini
  const [isSpeaking, setIsSpeaking] = useState(false); // Indicates if AI is speaking (playing audio)
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentSpeechText, setCurrentSpeechText] = useState(''); // Text from client-side STT
  const [conversationState, setConversationState] = useState<ConversationState>(INITIAL_CONVERSATION_STATE);


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
    // Fix: Use window.SpeechRecognition and window.webkitSpeechRecognition directly
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

    // Fix: Correct type for event parameter
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

    // Fix: Correct type for event parameter
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

    // Update conversationState with latest user feedback before sending
    const updatedConversationState = {
      ...conversationState,
      user_feedback: text.trim(),
      last_updated: new Date().toISOString(),
    };
    setConversationState(updatedConversationState);

    // Construct history for Gemini Chat API, including the serialized ConversationState
    // The history should alternate between 'user' and 'model'
    const chatHistory: Content[] = messages.map(msg => {
      let parts: { text?: string }[] = [];
      if (msg.aiResponsePlan) {
        // If it was an AI response plan, reconstruct a text summary for context
        parts.push({ text: `AI provided a plan: "${msg.aiResponsePlan.contextSummary}". Detailed guidance: "${msg.aiResponsePlan.detailedGuidance}". Next actions: ${msg.aiResponsePlan.nextInteractionOptions.join(', ')}` });
      } else if (msg.text) {
        parts.push({ text: msg.text });
      }
      return { role: msg.sender === 'user' ? 'user' : 'model', parts: parts };
    });

    // Prepend the ConversationState to the current user message for Gemini
    const userContentWithState: Content = {
      role: 'user',
      parts: [
        { text: `ConversationState: ${JSON.stringify(updatedConversationState)}` },
        { text: text.trim() }
      ]
    };

    chatHistory.push(userContentWithState); // Add the current user message with state to the history
    // The system instruction is already configured in initializeGeminiChat, so it doesn't need to be in chatHistory.

    const geminiMessagePlaceholder: ConversationMessage = {
      id: crypto.randomUUID(),
      sender: 'gemini',
      isStreaming: true,
      text: 'Thinking...',
    };
    setMessages((prev) => [...prev, geminiMessagePlaceholder]);

    try {
      const geminiResponse = await sendChatMessage(text, chatHistory); // Pass actual user message and full history
      const responseText = geminiResponse.text || "No response text.";

      let parsedAIResponsePlan: AIResponsePlan | null = null;
      // Attempt to parse the AI response plan
      const planResult = parseAIResponsePlan(responseText);
      if (planResult) {
        parsedAIResponsePlan = planResult;
        // Update the conversation state based on the AI's response
        setConversationState((prev) => ({
            ...prev,
            goal: planResult.contextSummary, // AI's context summary is often the updated goal
            // Fix: roadmapVersion is now a number directly from planResult
            roadmap_version: planResult.roadmapStatus.roadmapVersion || prev.roadmap_version + 1,
            current_phase: planResult.roadmapStatus.currentPhase,
            // Simple update for roadmap, a more robust update would merge/diff
            roadmap: planResult.updatedRoadmap.reduce((acc, phase) => {
                acc[phase.title] = { tasks: phase.tasks, outcome: phase.outcome };
                return acc;
            }, {} as { [key: string]: { tasks: string[]; outcome: string } }),
            progress: {
                completed_tasks: planResult.progressTracking.completed,
                pending_tasks: planResult.progressTracking.nextUp, // Assuming Next Up are pending
            },
            last_updated: new Date().toISOString(),
        }));
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === geminiMessagePlaceholder.id
            ? {
                ...msg,
                text: responseText, // Keep raw text for fallback/debugging
                aiResponsePlan: parsedAIResponsePlan, // Store parsed plan
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
            ? { ...msg, text: `Error: ${e.message}`, isStreaming: false, isGeneratingAudio: false }
            : msg
        )
      );
      setIsSpeaking(false); // Stop speaking indicator on error
    } finally {
      setIsSending(false);
    }
  }, [messages, isSending, isSpeaking, conversationState, initializeSpeechRecognition, currentSpeechText]);


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
