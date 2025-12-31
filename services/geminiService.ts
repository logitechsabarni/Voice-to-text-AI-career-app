
import { GoogleGenAI, Chat, GenerateContentResponse, Modality, Content } from '@google/genai';
import { SYSTEM_INSTRUCTION, GEMINI_CHAT_MODEL_NAME, GEMINI_TTS_MODEL_NAME, OUTPUT_AUDIO_SAMPLE_RATE } from '../constants';
import { decodeBase64, decodeAudioData } from '../utils/audioUtils';

// Global AudioContexts and state for playback
const outputAudioContext = new AudioContext({ sampleRate: OUTPUT_AUDIO_SAMPLE_RATE });
let nextStartTime = 0;
const playingAudioSources = new Set<AudioBufferSourceNode>();

// Global chat instance for conversational context
let chat: Chat | null = null;

interface GeminiServiceOptions {
  onSpeechEnd?: () => void;
  onSessionError?: (error: string) => void;
}

/**
 * Initializes the Gemini Chat session.
 * This should be called once at the start of the application.
 */
export function initializeGeminiChat(): void {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    chat = ai.chats.create({
      model: GEMINI_CHAT_MODEL_NAME,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    console.debug('Gemini Chat session initialized.');
  } catch (error) {
    console.error('Failed to initialize Gemini Chat:', error);
    // You might want to propagate this error to the UI
  }
}

/**
 * Sends a text message to the Gemini Chat model and returns the response.
 * @param message The user's message as text.
 * @param history The conversation history to maintain context.
 * @returns A promise that resolves with the Gemini's GenerateContentResponse.
 */
export async function sendChatMessage(message: string, history: Content[]): Promise<GenerateContentResponse> {
  if (!chat) {
    throw new Error('Gemini Chat session not initialized. Call initializeGeminiChat first.');
  }
  console.debug('Sending message to Gemini:', message);

  // The chat API automatically manages history if you continually use the same chat instance.
  // The 'history' parameter in 'sendMessage' is not typically used for the chat.sendMessage
  // method itself, but rather the 'chat.history' property of the chat instance.
  // We manage the history in App.tsx by building Content objects and storing them.
  // For `sendMessage`, we just send the new user message.
  const response = await chat.sendMessage({ message: message });
  console.debug('Received response from Gemini:', response.text);
  return response;
}

/**
 * Synthesizes speech from text using the Gemini TTS model and plays it.
 * @param text The text to synthesize.
 * @param options Options including onSpeechEnd callback.
 */
export async function synthesizeAndPlaySpeech(text: string, options?: GeminiServiceOptions): Promise<void> {
  if (!text.trim()) {
    console.warn('Attempted to synthesize empty text.');
    options?.onSpeechEnd?.();
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: GEMINI_TTS_MODEL_NAME,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO], // Must be an array with a single `Modality.AUDIO` element.
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
      },
    });

    const base64EncodedAudioString = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (base64EncodedAudioString) {
      nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);

      const audioBuffer = await decodeAudioData(
        decodeBase64(base64EncodedAudioString),
        outputAudioContext,
        OUTPUT_AUDIO_SAMPLE_RATE,
        1, // Assuming mono channel for simplicity
      );
      const source = outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputAudioContext.destination);

      source.addEventListener('ended', () => {
        playingAudioSources.delete(source);
        if (playingAudioSources.size === 0) {
          options?.onSpeechEnd?.(); // Notify UI that audio has finished
        }
      });

      source.start(nextStartTime);
      nextStartTime = nextStartTime + audioBuffer.duration;
      playingAudioSources.add(source);
    } else {
      console.warn('No audio data received from TTS API.');
      options?.onSpeechEnd?.();
    }
  } catch (error: any) {
    console.error('Error synthesizing or playing speech:', error);
    options?.onSessionError?.(`Audio synthesis failed: ${error.message}`);
    options?.onSpeechEnd?.(); // Ensure end callback is called even on error
  }
}

/**
 * Stops any currently playing audio.
 */
export function stopPlayingAudio(): void {
  for (const source of playingAudioSources.values()) {
    source.stop();
  }
  playingAudioSources.clear();
  nextStartTime = 0;
}

/**
 * Clears the Gemini Chat history and resets the chat instance.
 */
export function resetGeminiChat(): void {
  stopPlayingAudio();
  chat = null;
  initializeGeminiChat(); // Re-initialize for a fresh start
  console.debug('Gemini Chat history reset.');
}
