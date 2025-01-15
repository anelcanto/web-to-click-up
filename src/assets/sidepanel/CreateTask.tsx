// src/assets/sidepanel/CreateTask.tsx
import React, { useState, useEffect } from 'react';
import { RenderField, Field } from '../components/RenderField';

interface CreateTaskProps {
    onGoToSettings: () => void;
    selectedFieldIds: string[];
    availableFields: Field[];
}

export default function CreateTask({ onGoToSettings, selectedFieldIds, availableFields }: CreateTaskProps) {
    // Always required field
    const [taskName, setTaskName] = useState('');
    const [statusMsg, setStatusMsg] = useState('');
    // Field values for both standard and custom fields.
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

    // On mount, load saved defaults from chrome storage.
    useEffect(() => {
        chrome.storage.local.get(['defaults'], (result) => {
            if (result.defaults) {
                const { taskName: defaultTaskName, fieldValues: defaultFieldValues } = result.defaults;
                if (defaultTaskName) setTaskName(defaultTaskName);
                if (defaultFieldValues) setFieldValues(defaultFieldValues);
            }
        });
    }, []);

    const handleFieldChange = (fieldId: string, newValue: string) => {
        setFieldValues((prev) => ({
            ...prev,
            [fieldId]: newValue,
        }));
    };

    // Save the current state as defaults in Chrome Storage.
    const saveDefaults = () => {
        const defaults = {
            taskName,
            fieldValues,
        };
        chrome.storage.local.set({ defaults }, () => {
            setStatusMsg('Defaults saved!');
            setTimeout(() => setStatusMsg(''), 2000);
        });
    };

    // Clear defaults and also clear current UI state if needed.
    const clearDefaults = () => {
        chrome.storage.local.remove(['defaults'], () => {
            setTaskName('');
            setFieldValues({});
            setStatusMsg('Defaults cleared!');
            setTimeout(() => setStatusMsg(''), 2000);
        });
    };

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();

        if (!taskName.trim()) {
            setStatusMsg('Task Name is required.');
            return;
        }

        setStatusMsg('Creating task...');

        const standardFields = ['taskDescription', 'taskStatus', 'taskAssignee'];
        const standardFieldData: Record<string, any> = {};
        const customFieldsPayload: { id: string; value: any }[] = [];

        selectedFieldIds.forEach((fieldId) => {
            const rawValue = fieldValues[fieldId] || '';
            // Find the field definition if available (for custom fields)
            const fieldDef = availableFields.find((f) => f.id === fieldId);

            if (standardFields.includes(fieldId)) {
                switch (fieldId) {
                    case 'taskDescription':
                        standardFieldData['description'] = rawValue;
                        break;
                    case 'taskStatus':
                        standardFieldData['status'] = rawValue;
                        break;
                    case 'taskAssignee':
                        standardFieldData['assignees'] = [rawValue];
                        break;
                    default:
                        break;
                }
            } else if (fieldDef) {
                // Simple transformation; see previous examples for type-specific conversions.
                customFieldsPayload.push({
                    id: fieldId,
                    value: rawValue,
                });
            }
        });

        const taskData: any = {
            name: taskName.trim(),
            ...standardFieldData,
            custom_fields: customFieldsPayload,
        };

        chrome.runtime.sendMessage(
            {
                action: 'createTask',
                payload: taskData,
            },
            (response: any) => {
                if (response?.success) {
                    setStatusMsg('Task created successfully!');
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
                    const field = availableFields.find((f) => f.id === fieldId);
                    if (!field) return null;
                    return (
                        <div key={fieldId}>
                            <RenderField field={field} value={fieldValues[fieldId] || ''} onChange={handleFieldChange} />
                        </div>
                    );
                })}

                <button
                    type="submit"
                    className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    Create Task
                </button>
            </form>

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

            <p className="mt-2 text-sm text-red-600">{statusMsg}</p>
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