// src/components/TaskActions.tsx
import React from 'react';

interface TaskActionsProps {
    saveDefaults: () => void;
    clearDefaults: () => void;
}

const TaskActions: React.FC<TaskActionsProps> = ({ saveDefaults, clearDefaults }) => {
    return (
        <div className="flex justify-between space-x-2">
            <button
                onClick={saveDefaults}
                className="flex-grow p-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
                Save Defaults
            </button>
            <button
                onClick={clearDefaults}
                className="flex-grow p-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
                Clear Defaults
            </button>
        </div>
    );
};

export default TaskActions;