// src/sidepanel/CreateTask.tsx
import useTaskDefaults from '../hooks/useTaskDefaults';
import TaskFormFields from '../components/Task/TaskFormFields'
import TaskActions from '../components/Task/TaskActions';
import StatusMessage from '../components/StatusMessage';
import { Field } from '../components/RenderField';

interface CreateTaskProps {
    onGoToSettings: () => void;
    selectedFieldIds: string[];
    availableFields: Field[];
}

export default function CreateTask({ onGoToSettings, selectedFieldIds, availableFields }: CreateTaskProps) {
    // Use the custom hook to manage defaults
    const {
        taskName,
        setTaskName,
        fieldValues,
        setFieldValues,
        fieldUrlOptions,
        setFieldUrlOptions,
        statusMsg,
        saveDefaults,
        clearDefaults,
        loadDefaults
    } = useTaskDefaults();

    // Define standard fields
    const standardFields: Field[] = [
        { id: 'taskDescription', name: 'Task Description' },
    ];

    // Combine standard and custom fields
    const allFields = [...standardFields, ...availableFields];

    // Handle field changes
    const handleFieldChange = (fieldId: string, newValue: string) => {
        console.log('[CreateTask] handleFieldChange:', { fieldId, newValue });
        setFieldValues((prev) => ({
            ...prev,
            [fieldId]: newValue,
        }));
    };

    // Handle URL option changes
    const handleUrlOptionChange = (fieldId: string, option: string) => {
        console.log(`[CreateTask] URL option changed for ${fieldId} to:`, option);
        setFieldUrlOptions((prev) => ({
            ...prev,
            [fieldId]: option,
        }));
    };

    // Handle task creation
    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('[CreateTask] handleCreateTask invoked.');
        if (!taskName.trim()) {
            // Assuming StatusMessage component will handle displaying this
            console.log('[CreateTask] Task name is empty, cannot proceed.');
            // You might want to handle this differently, such as setting a status message
            return;
        }
        // Display creating task status
        // setStatusMsg('Creating task...'); // Moved to custom hook if needed

        const standardFieldIds = ['taskDescription'];
        const standardFieldData: Record<string, string | string[]> = {};
        const customFieldsPayload: { id: string; value: string }[] = [];

        selectedFieldIds.forEach((fieldId) => {
            const rawValue = fieldValues[fieldId] || '';
            console.log(`[CreateTask] Field ${fieldId} rawValue:`, rawValue);

            // Find the field definition if available
            const fieldDef = allFields.find((f) => f.id === fieldId);

            if (standardFieldIds.includes(fieldId)) {
                switch (fieldId) {
                    case 'taskDescription':
                        standardFieldData.description = rawValue;
                        break;
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

        interface TaskData {
            name: string;
            description?: string;
            custom_fields: Array<{ id: string; value: string }>;
        }

        const taskData: TaskData = {
            name: taskName.trim(),
            ...standardFieldData,
            custom_fields: customFieldsPayload,
        };

        console.log('[CreateTask] Final taskData being sent to background:', taskData);

        interface TaskResponse {
            success?: boolean;
            error?: string;
        }

        chrome.runtime.sendMessage(
            { action: 'createTask', payload: taskData },
            (response: TaskResponse) => {
                console.log('[CreateTask] Background script response:', response);
                if (response?.success) {
                    // Update status message
                    // setStatusMsg('Task created successfully!');
                    // Clear the UI state
                    setTaskName('');
                    setFieldValues({});
                    setFieldUrlOptions({});
                    loadDefaults();
                } else {
                    const err = response?.error || 'Unknown error';
                    // setStatusMsg(`Error: ${err}`);
                    console.error('[CreateTask] Task creation error:', err);
                }
            }

        );
    };

    return (
        <div className="p-4 w-72 font-sans">
            <h3 className="text-lg font-bold mb-4">Create Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-3 mb-4">
                <TaskFormFields
                    taskName={taskName}
                    setTaskName={setTaskName}
                    selectedFieldIds={selectedFieldIds}
                    allFields={allFields}
                    fieldValues={fieldValues}
                    handleFieldChange={handleFieldChange}
                    fieldUrlOptions={fieldUrlOptions}
                    handleUrlOptionChange={handleUrlOptionChange}
                />

                <button
                    type="submit"
                    className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    Create Task
                </button>
            </form>

            <TaskActions
                saveDefaults={saveDefaults}
                clearDefaults={clearDefaults}
            />

            <StatusMessage message={statusMsg} />

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