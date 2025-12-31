
import React from 'react';
import { ActionPlan } from '../types';

interface ActionPlanDisplayProps {
  plan: ActionPlan | null;
}

const ActionPlanDisplay: React.FC<ActionPlanDisplayProps> = ({ plan }) => {
  if (!plan) {
    return null;
  }

  return (
    <div className="p-2">
      <h2 className="text-2xl font-extrabold text-green-700 mb-2">{plan.title}</h2>
      <p className="text-gray-700 text-lg mb-4">{plan.goalClarification}</p>

      {plan.roadmap && plan.roadmap.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xl font-bold text-green-600 mb-3">Roadmap:</h3>
          {plan.roadmap.map((phase, phaseIndex) => (
            <div key={`phase-${phaseIndex}`} className="mb-4 p-3 border border-green-200 rounded-lg bg-green-50 shadow-sm">
              <h4 className="text-lg font-semibold text-green-700 mb-2">{phase.title}</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-800 ml-4">
                {phase.tasks.map((task, taskIndex) => (
                  <li key={`phase-${phaseIndex}-task-${taskIndex}`}>{task}</li>
                ))}
              </ul>
              {phase.outcome && <p className="mt-2 text-sm italic text-gray-600">Outcome: {phase.outcome}</p>}
            </div>
          ))}
        </div>
      )}

      {plan.dailyWeeklyPlan && plan.dailyWeeklyPlan.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xl font-bold text-green-600 mb-2">Daily or Weekly Plan:</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
            {plan.dailyWeeklyPlan.map((item, index) => (
              <li key={`daily-plan-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {plan.commonPitfalls && plan.commonPitfalls.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xl font-bold text-green-600 mb-2">Common Pitfalls:</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
            {plan.commonPitfalls.map((pitfall, index) => (
              <li key={`pitfall-${index}`}>{pitfall}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ActionPlanDisplay;
