
import React from 'react';
import { AIResponsePlan, AIResponseRoadmapPhase } from '../types';

interface AIResponsePlanDisplayProps {
  plan: AIResponsePlan;
}

const AIResponsePlanDisplay: React.FC<AIResponsePlanDisplayProps> = ({ plan }) => {
  if (!plan) {
    return null;
  }

  const renderTasks = (tasks: string[], isSubItem: boolean = false) => (
    <ul className={`list-disc list-inside space-y-1 text-gray-800 ${isSubItem ? 'ml-6' : 'ml-4'}`}>
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
    <div className="p-2 space-y-6">
      {/* Context Summary */}
      <div className="bg-gray-100 p-3 rounded-lg text-gray-700 text-lg shadow-sm">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Context Summary:</h3>
        <p>{plan.contextSummary}</p>
      </div>

      {/* Roadmap Status */}
      {plan.roadmapStatus && (
        <div className="bg-green-100 p-4 rounded-lg shadow-md border border-green-200">
          <h3 className="text-xl font-bold text-green-700 mb-3">Roadmap Status:</h3>
          <ul className="list-none space-y-2 text-gray-800">
            <li><span className="font-semibold text-green-800">Roadmap Version:</span> {plan.roadmapStatus.roadmapVersion}</li>
            <li><span className="font-semibold text-green-800">Current Phase:</span> {plan.roadmapStatus.currentPhase}</li>
            <li><span className="font-semibold text-green-800">Key Focus:</span> {plan.roadmapStatus.keyFocus}</li>
          </ul>
        </div>
      )}

      {/* Updated Roadmap */}
      {plan.updatedRoadmap && plan.updatedRoadmap.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-green-700 mb-4">Updated Roadmap:</h3>
          <div className="space-y-4">
            {plan.updatedRoadmap.map((phase: AIResponseRoadmapPhase, phaseIndex: number) => (
              <div key={`updated-phase-${phaseIndex}`} className="p-4 border border-green-300 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                <h4 className="text-xl font-semibold text-green-800 mb-3">{phase.title}</h4>
                {phase.tasks.length > 0 && (
                    <>
                        <p className="font-medium text-gray-700 mb-1">Tasks:</p>
                        {renderTasks(phase.tasks)}
                    </>
                )}
                {phase.outcome && <p className="mt-3 text-sm italic text-gray-600">Outcome: {phase.outcome}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Guidance */}
      {plan.detailedGuidance && (
        <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
          <h3 className="text-xl font-bold text-blue-700 mb-3">Detailed Guidance:</h3>
          {/* Using pre-wrap to respect newlines for paragraph breaks */}
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{plan.detailedGuidance}</p>
        </div>
      )}

      {/* Progress Tracking */}
      {plan.progressTracking && (
        <div className="bg-green-100 p-4 rounded-lg shadow-md border border-green-200">
          <h3 className="text-xl font-bold text-green-700 mb-3">Progress Tracking:</h3>
          {plan.progressTracking.completed.length > 0 && (
            <div className="mb-2">
              <p className="font-semibold text-gray-800 mt-2">Completed:</p>
              {renderProgressItems(plan.progressTracking.completed, 'completed')}
            </div>
          )}
          {plan.progressTracking.inProgress.length > 0 && (
            <div className="mb-2">
              <p className="font-semibold text-gray-800 mt-2">In Progress:</p>
              {renderProgressItems(plan.progressTracking.inProgress, 'inProgress')}
            </div>
          )}
          {plan.progressTracking.nextUp.length > 0 && (
            <div className="mb-2">
              <p className="font-semibold text-gray-800 mt-2">Next Up:</p>
              {renderProgressItems(plan.progressTracking.nextUp, 'nextUp')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIResponsePlanDisplay;