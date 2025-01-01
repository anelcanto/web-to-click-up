// src/assets/sidepanel/CreateTask.tsx
import React, { useState, useEffect } from 'react';

interface CreateTaskProps {
    onGoToSettings: () => void;
    selectedFieldIds: string[];
    availableFields: Field[];
}

interface Field {
    id: string;
    name: string;
}

export default function CreateTask({ onGoToSettings, selectedFieldIds, availableFields }: CreateTaskProps) {
    // Always required field
    const [taskName, setTaskName] = useState('');
    const [statusMsg, setStatusMsg] = useState('');

    // All user-selected fields (standard and custom)
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

    useEffect(() => {
        // Load fieldValues if needed from storage or other sources
    }, []);

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate Task Name
        if (!taskName.trim()) {
            setStatusMsg('Task Name is required.');
            return;
        }

        setStatusMsg('Creating task...');

        // Define which fields are standard and need special handling
        const standardFields = ['taskDescription', 'taskStatus', 'taskAssignee']; // Adjust as needed
        const standardFieldData: Record<string, any> = {};
        const customFieldsPayload: { id: string; value: string }[] = [];

        selectedFieldIds.forEach((fieldId) => {
            const value = fieldValues[fieldId] || '';
            if (standardFields.includes(fieldId)) {
                // Map standard fields to their respective ClickUp API properties
                switch (fieldId) {
                    case 'taskDescription':
                        standardFieldData['description'] = value;
                        break;
                    case 'taskStatus':
                        standardFieldData['status'] = value;
                        break;
                    case 'taskAssignee':
                        // Assuming value is a user ID; ClickUp API expects an array of user IDs
                        standardFieldData['assignees'] = [value];
                        break;
                    // Add more cases if you have additional standard fields
                    default:
                        break;
                }
            } else {
                // Treat as custom field
                customFieldsPayload.push({
                    id: fieldId,
                    value: value,
                });
            }
        });

        // Construct the payload for ClickUp API
        const taskData: any = {
            name: taskName.trim(),
            ...standardFieldData,
            custom_fields: customFieldsPayload,
        };

        // Send the task data to the background script or API handler
        chrome.runtime.sendMessage(
            {
                action: 'createTask',
                payload: taskData,
            },
            (response: any) => {
                if (response?.success) {
                    setStatusMsg('Task created successfully!');
                    // Reset form fields
                    setTaskName('');
                    setFieldValues({});
                } else {
                    setStatusMsg(`Error: ${response?.error || 'Unknown error'}`);
                }
            }
        );
    };

    return (
        <div className="p-4 w-72 font-sans">
            <h3 className="text-lg font-bold mb-4">Create Task</h3>

            <form onSubmit={handleCreateTask} className="space-y-3 mb-4">
                {/* Task Name - Always Required */}
                <input
                    type="text"
                    placeholder="Task Name (required)"
                    aria-label="Task Name"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    autoFocus
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />

                {/* Render inputs for each selected field */}
                {selectedFieldIds.map((fieldId) => {
                    // Find the field name from availableFields
                    const field = availableFields.find(f => f.id === fieldId);
                    const placeholder = field ? field.name : `Field ${fieldId}`;

                    return (
                        <input
                            key={fieldId}
                            type="text"
                            placeholder={placeholder}
                            aria-label={`Field ${fieldId}`}
                            value={fieldValues[fieldId] || ''}
                            onChange={(e) =>
                                setFieldValues((prev) => ({
                                    ...prev,
                                    [fieldId]: e.target.value,
                                }))
                            }
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    );
                })}

                <button
                    type="submit"
                    className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    Create Task
                </button>
            </form>

            <p className="text-sm text-red-600">{statusMsg}</p>
            <hr className="my-4" />
            <button
                onClick={onGoToSettings}
                className="w-full p-2 text-blue-700 underline hover:text-blue-900"
            >
                Settings
            </button>
        </div>
    );
}