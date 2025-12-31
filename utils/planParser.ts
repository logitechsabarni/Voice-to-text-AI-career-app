
import { ActionPlan, RoadmapPhase } from '../types';

/**
 * Parses a string output from the Gemini AI into a structured ActionPlan object.
 * @param planString The raw string output from the AI.
 * @returns An ActionPlan object or null if parsing fails.
 */
export function parseActionPlan(planString: string): ActionPlan | null {
  const result: Partial<ActionPlan> = {
    roadmap: [],
    dailyWeeklyPlan: [],
    commonPitfalls: [],
    nextActions: [],
  };

  const lines = planString.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  let currentSection: 'title' | 'goalClarification' | 'roadmap' | 'dailyWeeklyPlan' | 'commonPitfalls' | 'nextActions' | null = null;
  let currentPhase: RoadmapPhase | null = null;

  for (const line of lines) {
    if (line.startsWith('Title:')) {
      result.title = line.substring('Title:'.length).trim();
      currentSection = 'title';
      continue;
    }
    if (line.startsWith('Goal Clarification:')) {
      result.goalClarification = line.substring('Goal Clarification:'.length).trim();
      currentSection = 'goalClarification';
      continue;
    }
    if (line.startsWith('Roadmap:')) {
      currentSection = 'roadmap';
      continue;
    }
    if (line.startsWith('Daily or Weekly Plan:')) {
      currentSection = 'dailyWeeklyPlan';
      continue;
    }
    if (line.startsWith('Common Pitfalls:')) {
      currentSection = 'commonPitfalls';
      continue;
    }
    if (line.startsWith('Next Actions:')) {
      currentSection = 'nextActions';
      continue;
    }

    // Handle sections
    switch (currentSection) {
      case 'goalClarification':
        if (!result.goalClarification) { // if not already set by header
            result.goalClarification = line;
        }
        break;
      case 'roadmap':
        if (line.startsWith('Phase ')) {
          if (currentPhase) {
            result.roadmap?.push(currentPhase);
          }
          currentPhase = {
            title: line,
            tasks: [],
            outcome: '',
          };
        } else if (currentPhase) {
          if (line.startsWith('- Task ')) {
            currentPhase.tasks.push(line);
          } else if (line.startsWith('- Outcome:')) {
            currentPhase.outcome = line.substring('- Outcome:'.length).trim();
          }
        }
        break;
      case 'dailyWeeklyPlan':
        result.dailyWeeklyPlan?.push(line);
        break;
      case 'commonPitfalls':
        result.commonPitfalls?.push(line);
        break;
      case 'nextActions':
        result.nextActions?.push(line);
        break;
    }
  }

  // Add the last phase if it exists
  if (currentPhase) {
    result.roadmap?.push(currentPhase);
  }

  // Validate minimum required fields for a plan
  if (result.title && result.goalClarification && result.roadmap && result.roadmap.length > 0) {
    return result as ActionPlan;
  }
  return null;
}
