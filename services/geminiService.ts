
import { GoogleGenAI, Chat, GenerateContentResponse, Modality, Content } from '@google/genai';
import { SYSTEM_INSTRUCTION, GEMINI_CHAT_MODEL_NAME, GEMINI_TTS_MODEL_NAME, OUTPUT_AUDIO_SAMPLE_RATE } from '../constants';
import { decodeBase64, decodeAudioData } from '../utils/audioUtils';

// Global AudioContexts and state for playback
const outputAudioContext = new AudioContext({ sampleRate: OUTPUT_AUDIO_SAMPLE_RATE });
let nextStartTime = 0;
const playingAudioSources = new Set<AudioBufferSourceNode>();

// Global chat instance for conversational context (only used for its creation for now)
let chat: Chat | null = null; // Changed from `chat` to `chatInstance` to avoid confusion

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
    // We are no longer using the `Chat` object's internal history management
    // as we explicitly pass `Content[]` to `generateContent` with each call.
    // However, keeping `ai.chats.create` to ensure the model is correctly set up if needed.
    // The chat instance itself is not used for `sendMessage` anymore in the new approach.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    chat = ai.chats.create({
      model: GEMINI_CHAT_MODEL_NAME,
      config: {
        // SYSTEM_INSTRUCTION is now passed directly in the `contents` for `generateContent`
        // in App.tsx to ensure it's always at the beginning of the context.
        // It's still good practice to have it here for clarity if this were to revert.
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
 * This function now takes the full `Content[]` array as `contents` to allow
 * explicit control over the conversation history and the inclusion of `ConversationState`.
 * @param _userMessage The user's new message (not directly used by generateContent, but good for logs)
 * @param contents The full array of Content objects, including system instruction, conversation state, and history.
 * @returns A promise that resolves with the Gemini's GenerateContentResponse.
 */
export async function sendChatMessage(_userMessage: string, contents: Content[]): Promise<GenerateContentResponse> {
  // We're using `ai.models.generateContent` directly to send the full `contents` array per turn,
  // which includes the `SYSTEM_INSTRUCTION` and serialized `ConversationState`.
  // This bypasses the automatic history management of the `Chat` instance,
  // giving us explicit control over the context sent with each API call.
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    console.debug('Sending full context to Gemini:', contents);

    const response = await ai.models.generateContent({
      model: GEMINI_CHAT_MODEL_NAME,
      contents: contents,
    });
    console.debug('Received response from Gemini:', response.text);
    return response;
  } catch (error) {
    console.error('Gemini API error during content generation:', error);
    throw error; // Re-throw to be handled by App.tsx
  }
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
  chat = null; // Clear the old chat instance
  initializeGeminiChat(); // Re-initialize for a fresh start
  console.debug('Gemini Chat history reset.');
}