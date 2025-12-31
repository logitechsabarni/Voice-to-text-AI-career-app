
import { Content } from "@google/genai";

export interface ConversationMessage {
  id: string;
  sender: 'user' | 'gemini';
  text?: string; // Text is now optional if it's a structured plan
  actionPlan?: ActionPlan; // Can now contain a structured plan
  isStreaming?: boolean;
  isGeneratingAudio?: boolean; // New prop to indicate audio generation
  rawMessageContent?: Content; // Store raw message content for chat history
}

export interface RoadmapPhase {
  title: string;
  tasks: string[];
  outcome: string;
}

export interface ActionPlan {
  title: string;
  goalClarification: string;
  roadmap: RoadmapPhase[];
  dailyWeeklyPlan: string[];
  commonPitfalls: string[];
  nextActions: string[];
}
