// src/assets/sidepanel/CreateTask.tsx
import React, { useState } from 'react';
import { RenderField, Field } from '../components/RenderField';

interface CreateTaskProps {
    onGoToSettings: () => void;
    selectedFieldIds: string[];
    availableFields: Field[]; // each Field should have at least id, type, and label
}

export default function CreateTask({ onGoToSettings, selectedFieldIds, availableFields }: CreateTaskProps) {
    // Always required field
    const [taskName, setTaskName] = useState('');
    const [statusMsg, setStatusMsg] = useState('');

    // All user-selected fields (standard and custom)
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

    const handleFieldChange = (fieldId: string, newValue: string) => {
        setFieldValues((prev) => ({
            ...prev,
            [fieldId]: newValue,
        }));
    };

    // Transform the value based on field type
    const transformFieldValue = (field: Field, value: string) => {
        // Always wrap the final value inside an object with key "value"
        switch (field.type) {
            case 'date':
                // Convert to Unix timestamp; include time=true if needed.
                return { value: new Date(value).getTime(), value_options: { time: true } };
            case 'checkbox':
                return { value: value === 'true' };
            case 'number':
            case 'currency':
                return { value: Number(value) };
            case 'drop_down':
                // Expect a drop down option id
                return { value: value };
            case 'emoji':
                // For ratings: assume an integer value (with validation performed elsewhere)
                return { value: parseInt(value, 10) };
            // Add additional field type conversions as needed.
            default:
                // For text, short_text, or other types, use string value.
                return { value: value };
        }
    };

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();

        if (!taskName.trim()) {
            setStatusMsg('Task Name is required.');
            return;
        }

        setStatusMsg('Creating task...');

        // Standard fields mapping (adjust as needed)
        const standardFields = ['taskDescription', 'taskStatus', 'taskAssignee'];
        const standardFieldData: Record<string, any> = {};
        const customFieldsPayload: { id: string; value: any }[] = [];

        selectedFieldIds.forEach((fieldId) => {
            const rawValue = fieldValues[fieldId] || '';
            // Find field definition if available (if not a standard field)
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
                        // Wrap assignee id in an array
                        standardFieldData['assignees'] = [rawValue];
                        break;
                    default:
                        break;
                }
            } else if (fieldDef) {
                // Transform the field value based on its type.
                const transformedData = transformFieldValue(fieldDef, rawValue);
                customFieldsPayload.push({
                    id: fieldId,
                    ...transformedData,
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

                <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                    Create Task
                </button>
            </form>

            <p className="text-sm text-red-600">{statusMsg}</p>
            <hr className="my-4" />
            <button onClick={onGoToSettings} className="w-full p-2 text-blue-700 underline hover:text-blue-900">
                Settings
            </button>
        </div>
    );
}