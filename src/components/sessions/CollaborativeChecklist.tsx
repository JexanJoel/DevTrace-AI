import { CheckCircle, Circle, Users } from 'lucide-react';

interface ChecklistItem {
  item: string;
  priority: 'high' | 'medium' | 'low';
}

interface Props {
  items: ChecklistItem[];
  isChecked: (index: number) => boolean;
  checkedBy: (index: number) => string | null;
  onToggle: (index: number, currentChecked: boolean) => void;
  completedCount: number;
  isCollaborative: boolean;
  currentUserName: string;
}

const CollaborativeChecklist = ({
  items,
  isChecked,
  checkedBy,
  onToggle,
  completedCount,
  isCollaborative,
  currentUserName,
}: Props) => {
  return (
    <div className="space-y-2">

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400">
          {isCollaborative
            ? 'Shared checklist — updates sync live to all collaborators'
            : 'Work through these checks in order'
          }
        </p>
        {isCollaborative && (
          <div className="flex items-center gap-1 text-xs text-indigo-600 font-medium">
            <Users size={11} />
            Shared
          </div>
        )}
      </div>

      {/* Items */}
      {items.map((item, i) => {
        const checked = isChecked(i);
        const who = checkedBy(i);
        const checkedByMe = who === currentUserName;

        return (
          <button
            key={i}
            onClick={() => onToggle(i, checked)}
            className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
              checked
                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950'
                : 'border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 bg-gray-50 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
            }`}
          >
            {/* Checkbox icon */}
            <div className="flex-shrink-0 mt-0.5">
              {checked
                ? <CheckCircle size={16} className="text-green-500" />
                : <Circle size={16} className="text-gray-300" />
              }
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <span className={`text-sm block ${
                checked ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {item.item}
              </span>

              {/* Who checked it */}
              {checked && who && isCollaborative && (
                <span className="text-xs text-green-600 dark:text-green-400 mt-0.5 block">
                  ✓ {checkedByMe ? 'You' : who} checked this off
                </span>
              )}
            </div>

            {/* Priority badge */}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
              item.priority === 'high'
                ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
                : item.priority === 'medium'
                  ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {item.priority}
            </span>
          </button>
        );
      })}

      {/* Progress footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mr-3">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: items.length > 0 ? `${(completedCount / items.length) * 100}%` : '0%' }}
          />
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">
          {completedCount}/{items.length} completed
        </span>
      </div>
    </div>
  );
};

export default CollaborativeChecklist;