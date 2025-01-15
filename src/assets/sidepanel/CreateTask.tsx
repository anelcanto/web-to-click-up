// src/assets/sidepanel/CreateTask.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
    // State: mapping for URL field options (e.g., "manual" or "current")
    const [fieldUrlOptions, setFieldUrlOptions] = useState<Record<string, string>>({});

    // Encapsulated logic for loading defaults from Chrome storage.
    const loadDefaults = useCallback(() => {
        console.log('[CreateTask] loadDefaults invoked.');
        chrome.storage.local.get(['defaults'], (result) => {
            console.log('[CreateTask] Chrome storage get defaults:', result.defaults);
            if (result.defaults) {
                const { taskName: defaultTaskName, fieldValues: defaultFieldValues, fieldUrlOptions: defaultFieldUrlOptions } = result.defaults;
                if (defaultTaskName) {
                    console.log('[CreateTask] Setting taskName from defaults:', defaultTaskName);
                    setTaskName(defaultTaskName);
                }
                if (defaultFieldValues) {
                    console.log('[CreateTask] Setting fieldValues from defaults:', defaultFieldValues);
                    setFieldValues(defaultFieldValues);
                }
                if (defaultFieldUrlOptions) {
                    console.log('[CreateTask] Setting fieldUrlOptions from defaults:', defaultFieldUrlOptions);
                    setFieldUrlOptions(defaultFieldUrlOptions);
                }
            }
        });
    }, []);

    // Load defaults on initial mount.
    useEffect(() => {
        loadDefaults();
    }, [loadDefaults]);

    const handleFieldChange = (fieldId: string, newValue: string) => {
        console.log('[CreateTask] handleFieldChange:', { fieldId, newValue });
        setFieldValues((prev) => ({
            ...prev,
            [fieldId]: newValue,
        }));
    };

    // Handler for updating the URL option choice from RenderField.
    const handleUrlOptionChange = (fieldId: string, option: string) => {
        console.log(`[CreateTask] URL option changed for ${fieldId} to:`, option);
        setFieldUrlOptions((prev) => ({
            ...prev,
            [fieldId]: option,
        }));
    };

    // Save defaults including fieldValues and URL option settings.
    // If the URL option for a field is "current", then do not save its current value.
    const saveDefaults = () => {
        // Create a new copy of fieldValues that excludes URL values when option is "current"
        const filteredFieldValues = { ...fieldValues };
        // For each field ID in fieldUrlOptions that relates to a URL field,
        // if the option is "current", clear that field's value.
        Object.keys(fieldUrlOptions).forEach((fieldId) => {
            if (fieldUrlOptions[fieldId] === "current") {
                console.log(`[CreateTask] For field ${fieldId}, URL option is "current" – clearing the saved value.`);
                filteredFieldValues[fieldId] = ''; // or you could omit it altogether
            }
        });

        const defaults = {
            taskName,
            fieldValues: filteredFieldValues,
            fieldUrlOptions,
        };
        console.log('[CreateTask] saveDefaults:', defaults);
        chrome.storage.local.set({ defaults }, () => {
            console.log('[CreateTask] Defaults saved to Chrome storage.');
            setStatusMsg('Defaults saved!');
            setTimeout(() => setStatusMsg(''), 2000);
        });
    };

    // Clear defaults and also clear current UI state, then reload defaults.
    const clearDefaults = () => {
        console.log('[CreateTask] clearDefaults invoked.');
        chrome.storage.local.remove(['defaults'], () => {
            console.log('[CreateTask] Defaults removed from Chrome storage.');
            // Clear the UI state
            setTaskName('');
            setFieldValues({});
            setFieldUrlOptions({});
            // Immediately reload defaults from Chrome storage
            loadDefaults();
            setStatusMsg('Defaults cleared and reloaded!');
            setTimeout(() => setStatusMsg(''), 2000);
        });
    };

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('[CreateTask] handleCreateTask invoked.');
        if (!taskName.trim()) {
            setStatusMsg('Task Name is required.');
            console.log('[CreateTask] Task name is empty, cannot proceed.');
            return;
        }
        setStatusMsg('Creating task...');

        const standardFields = ['taskDescription'] //, 'taskStatus', 'taskAssignee'];
        const standardFieldData: Record<string, any> = {};
        const customFieldsPayload: { id: string; value: any }[] = [];

        selectedFieldIds.forEach((fieldId) => {
            const rawValue = fieldValues[fieldId] || '';
            console.log(`[CreateTask] Field ${fieldId} rawValue:`, rawValue);

            // Find the field definition if available
            const fieldDef = availableFields.find((f) => f.id === fieldId);

            if (standardFields.includes(fieldId)) {
                switch (fieldId) {
                    case 'taskDescription':
                        standardFieldData.description = rawValue;
                        break;
                    // case 'taskStatus':
                    //     standardFieldData.status = rawValue;
                    //     break;
                    // case 'taskAssignee':
                    //     standardFieldData.assignees = [rawValue];
                    //     break;
                    default:
                        break;
                }
            } else if (fieldDef) {
                // Basic transformation. For URL fields, RenderField is assumed to have set the correct value.
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

        console.log('[CreateTask] Final taskData being sent to background:', taskData);
        chrome.runtime.sendMessage(
            { action: 'createTask', payload: taskData },
            (response: any) => {
                console.log('[CreateTask] Background script response:', response);
                if (response?.success) {
                    setStatusMsg('Task created successfully!');
                    console.log('[CreateTask] Task created successfully. Clearing UI state.');
                    // Clear the UI state...
                    setTaskName('');
                    setFieldValues({});
                    setFieldUrlOptions({});
                    // Then reload defaults from storage.
                    loadDefaults();
                } else {
                    const err = response?.error || 'Unknown error';
                    setStatusMsg(`Error: ${err}`);
                    console.error('[CreateTask] Task creation error:', err);
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
                    onChange={(e) => {
                        console.log('[CreateTask] Task name changed:', e.target.value);
                        setTaskName(e.target.value);
                    }}
                    autoFocus
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                {/* Render inputs for each selected field */}
                {selectedFieldIds.map((fieldId) => {
                    const field = availableFields.find((f) => f.id === fieldId);
                    if (!field) {
                        console.warn('[CreateTask] No field definition found for fieldId:', fieldId);
                        return null;
                    }
                    return (
                        <div key={fieldId}>
                            <RenderField
                                field={field}
                                value={fieldValues[fieldId] || ''}
                                onChange={handleFieldChange}
                                // For URL fields, pass the current option (or default to manual) and the change handler.
                                urlOption={field.type === 'url' ? fieldUrlOptions[fieldId] || "manual" : undefined}
                                onUrlOptionChange={field.type === 'url' ? handleUrlOptionChange : undefined}
                            />
                        </div>
                    );
                })}
                <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                    Create Task
                </button>
            </form>

            <div className="flex justify-between space-x-2">
                <button onClick={saveDefaults} className="flex-grow p-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
                    Save Defaults
                </button>
                <button onClick={clearDefaults} className="flex-grow p-2 bg-red-600 text-white rounded hover:bg-red-700 transition">
                    Clear Defaults
                </button>
            </div>

            <p className="mt-2 text-sm text-red-600">{statusMsg}</p>
            <hr className="my-4" />
            <button onClick={onGoToSettings} className="w-full p-2 text-blue-700 underline hover:text-blue-900">
                Settings
            </button>
        </div>
    );
}