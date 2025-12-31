
import { Content } from "@google/genai";

// --- Conversation State (Input to AI) ---
export interface ConversationState {
  goal: string;
  clarified_constraints: string;
  roadmap_version: number;
  current_phase: string;
  roadmap: { [key: string]: { tasks: string[]; outcome: string } }; // Keyed by Phase title
  progress: {
    completed_tasks: string[];
    pending_tasks: string[];
  };
  user_feedback: string;
  last_updated: string; // ISO string
}

// --- AI Response Plan (Output from AI) ---
export interface AIResponseRoadmapPhase {
  title: string;
  tasks: string[]; // These are the '- Tasks:' lines
  outcome: string;
}

export interface AIResponsePlan {
  contextSummary: string;
  roadmapStatus: {
    roadmapVersion: number;
    currentPhase: string;
    keyFocus: string;
  };
  updatedRoadmap: AIResponseRoadmapPhase[];
  detailedGuidance: string;
  progressTracking: {
    completed: string[];
    inProgress: string[];
    nextUp: string[];
  };
  nextInteractionOptions: string[];
}

// --- General Chat Message Structure ---
export interface ConversationMessage {
  id: string;
  sender: 'user' | 'gemini';
  text?: string; // Text is now optional if it's a structured plan
  aiResponsePlan?: AIResponsePlan; // Can now contain the structured AI response
  isStreaming?: boolean;
  isGeneratingAudio?: boolean; // New prop to indicate audio generation
  rawResponseText?: string; // To store the full raw text for copy feature
}

// --- Action Plan (Inferred for ActionPlanDisplay.tsx component) ---
// This interface is inferred from the usage in components/ActionPlanDisplay.tsx
export interface ActionPlan {
  title: string;
  goalClarification: string;
  roadmap?: {
    title: string;
    tasks: string[];
    outcome?: string;
  }[];
  dailyWeeklyPlan?: string[];
  commonPitfalls?: string[];
}