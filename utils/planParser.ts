
import { AIResponsePlan, AIResponseRoadmapPhase } from '../types';

/**
 * Parses a string output from the Gemini AI into a structured AIResponsePlan object.
 * @param planString The raw string output from the AI.
 * @returns An AIResponsePlan object or null if parsing fails or structure is not matched.
 */
export function parseAIResponsePlan(planString: string): AIResponsePlan | null {
  const result: Partial<AIResponsePlan> = {
    updatedRoadmap: [],
    progressTracking: {
      completed: [],
      inProgress: [],
      nextUp: [],
    },
    nextInteractionOptions: [],
  };

  const lines = planString.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  let currentSection:
    | 'contextSummary'
    | 'roadmapStatus'
    | 'updatedRoadmap'
    | 'detailedGuidance'
    | 'progressTracking'
    | 'nextInteractionOptions'
    | null = null;
  let currentRoadmapPhase: AIResponseRoadmapPhase | null = null;

  for (const line of lines) {
    if (line.startsWith('Context Summary:')) {
      result.contextSummary = line.substring('Context Summary:'.length).trim();
      currentSection = 'contextSummary';
      continue;
    }
    if (line.startsWith('Roadmap Status:')) {
      currentSection = 'roadmapStatus';
      continue;
    }
    if (line.startsWith('Updated Roadmap:')) {
      currentSection = 'updatedRoadmap';
      continue;
    }
    if (line.startsWith('Detailed Guidance:')) {
      result.detailedGuidance = line.substring('Detailed Guidance:'.length).trim();
      currentSection = 'detailedGuidance';
      continue;
    }
    if (line.startsWith('Progress Tracking:')) {
      currentSection = 'progressTracking';
      continue;
    }
    if (line.startsWith('Next Interaction Options:')) {
      currentSection = 'nextInteractionOptions';
      continue;
    }

    // Handle content within sections
    switch (currentSection) {
      case 'roadmapStatus':
        // Fix: Initialize roadmapStatus with default values and parse roadmapVersion to number
        if (!result.roadmapStatus) {
            result.roadmapStatus = {
                roadmapVersion: 0,
                currentPhase: '',
                keyFocus: '',
            };
        }
        if (line.startsWith('- Roadmap Version:')) {
          const versionString = line.substring('- Roadmap Version:'.length).trim();
          const parsedVersion = parseInt(versionString.replace('v', ''));
          result.roadmapStatus.roadmapVersion = isNaN(parsedVersion) ? 0 : parsedVersion; // Default to 0 if parsing fails
        } else if (line.startsWith('- Current Phase:')) {
          result.roadmapStatus.currentPhase = line.substring('- Current Phase:'.length).trim();
        } else if (line.startsWith('- Key Focus:')) {
          result.roadmapStatus.keyFocus = line.substring('- Key Focus:'.length).trim();
        }
        break;
      case 'updatedRoadmap':
        if (line.startsWith('Phase ')) {
          if (currentRoadmapPhase) {
            result.updatedRoadmap?.push(currentRoadmapPhase);
          }
          currentRoadmapPhase = {
            title: line,
            tasks: [],
            outcome: '',
          };
        } else if (currentRoadmapPhase) {
          if (line.startsWith('- Tasks:')) {
            currentRoadmapPhase.tasks.push(line.substring('- Tasks:'.length).trim());
          } else if (line.startsWith('- Outcome:')) {
            currentRoadmapPhase.outcome = line.substring('- Outcome:'.length).trim();
          }
        }
        break;
      case 'detailedGuidance':
        if (!result.detailedGuidance) { // if not already set by header
            result.detailedGuidance = line;
        } else {
            result.detailedGuidance += `\n${line}`; // Append additional lines to guidance
        }
        break;
      case 'progressTracking':
        // Fix: Ensure progressTracking properties are initialized before pushing
        if (!result.progressTracking) {
          result.progressTracking = {
            completed: [],
            inProgress: [],
            nextUp: [],
          };
        }
        if (line.startsWith('- Completed:')) {
          result.progressTracking.completed.push(line.substring('- Completed:'.length).trim());
        } else if (line.startsWith('- In Progress:')) {
          result.progressTracking.inProgress.push(line.substring('- In Progress:'.length).trim());
        } else if (line.startsWith('- Next Up:')) {
          result.progressTracking.nextUp.push(line.substring('- Next Up:'.length).trim());
        }
        break;
      case 'nextInteractionOptions':
        result.nextInteractionOptions?.push(line.substring('-').trim()); // Remove leading '-'
        break;
    }
  }

  // Add the last phase if it exists
  if (currentRoadmapPhase) {
    result.updatedRoadmap?.push(currentRoadmapPhase);
  }

  // Basic validation: ensure key parts are present
  if (
    result.contextSummary &&
    result.roadmapStatus?.roadmapVersion !== undefined && // Check for existence as number
    result.updatedRoadmap &&
    result.detailedGuidance &&
    result.progressTracking
  ) {
    return result as AIResponsePlan;
  }
  return null;
}