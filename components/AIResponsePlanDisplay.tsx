
import React from 'react';
import { AIResponsePlan, AIResponseRoadmapPhase } from '../types';

interface AIResponsePlanDisplayProps {
  plan: AIResponsePlan;
}

const AIResponsePlanDisplay: React.FC<AIResponsePlanDisplayProps> = ({ plan }) => {
  if (!plan) {
    return null;
  }

  const renderTasks = (tasks: string[]) => (
    <ul className="list-disc list-inside space-y-1 text-gray-800 ml-4">
      {tasks.map((task, index) => (
        <li key={`task-${index}`}>{task}</li>
      ))}
    </ul>
  );

  const renderProgressItems = (items: string[], type: 'completed' | 'inProgress' | 'nextUp') => {
    const icon =
      type === 'completed'
        ? '✅'
        : type === 'inProgress'
        ? '⏳'
        : '▶️';
    const color =
      type === 'completed'
        ? 'text-green-700'
        : type === 'inProgress'
        ? 'text-yellow-700'
        : 'text-blue-700';

    if (items.length === 0 || (items.length === 1 && items[0] === 'None')) {
      return <p className="ml-4 text-gray-600 italic">None</p>;
    }

    return (
      <ul className="list-none space-y-1 text-gray-800 ml-4">
        {items.map((item, index) => (
          <li key={`progress-${type}-${index}`} className="flex items-start">
            <span className={`mr-2 ${color}`}>{icon}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="p-2">
      {/* Context Summary */}
      <p className="text-gray-700 text-lg mb-4">{plan.contextSummary}</p>

      {/* Roadmap Status */}
      {plan.roadmapStatus && (
        <div className="mb-4 bg-green-100 p-3 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold text-green-700 mb-2">Roadmap Status:</h3>
          <ul className="list-none space-y-1 text-gray-800">
            <li><span className="font-semibold">Roadmap Version:</span> {plan.roadmapStatus.roadmapVersion}</li>
            <li><span className="font-semibold">Current Phase:</span> {plan.roadmapStatus.currentPhase}</li>
            <li><span className="font-semibold">Key Focus:</span> {plan.roadmapStatus.keyFocus}</li>
          </ul>
        </div>
      )}

      {/* Updated Roadmap */}
      {plan.updatedRoadmap && plan.updatedRoadmap.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xl font-bold text-green-700 mb-3">Updated Roadmap:</h3>
          {plan.updatedRoadmap.map((phase: AIResponseRoadmapPhase, phaseIndex: number) => (
            <div key={`updated-phase-${phaseIndex}`} className="mb-4 p-3 border border-green-200 rounded-lg bg-white shadow-sm">
              <h4 className="text-lg font-semibold text-green-800 mb-2">{phase.title}</h4>
              {phase.tasks.length > 0 && (
                  <>
                      <p className="font-medium text-gray-700">Tasks:</p>
                      {renderTasks(phase.tasks)}
                  </>
              )}
              {phase.outcome && <p className="mt-2 text-sm italic text-gray-600">Outcome: {phase.outcome}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Detailed Guidance */}
      {plan.detailedGuidance && (
        <div className="mb-4">
          <h3 className="text-xl font-bold text-green-700 mb-2">Detailed Guidance:</h3>
          {/* Using pre-wrap to respect newlines for paragraph breaks */}
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{plan.detailedGuidance}</p>
        </div>
      )}

      {/* Progress Tracking */}
      {plan.progressTracking && (
        <div className="mb-4 bg-green-100 p-3 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold text-green-700 mb-2">Progress Tracking:</h3>
          {plan.progressTracking.completed.length > 0 && (
            <>
              <p className="font-semibold text-gray-800 mt-2">Completed:</p>
              {renderProgressItems(plan.progressTracking.completed, 'completed')}
            </>
          )}
          {plan.progressTracking.inProgress.length > 0 && (
            <>
              <p className="font-semibold text-gray-800 mt-2">In Progress:</p>
              {renderProgressItems(plan.progressTracking.inProgress, 'inProgress')}
            </>
          )}
          {plan.progressTracking.nextUp.length > 0 && (
            <>
              <p className="font-semibold text-gray-800 mt-2">Next Up:</p>
              {renderProgressItems(plan.progressTracking.nextUp, 'nextUp')}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AIResponsePlanDisplay;