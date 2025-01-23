// src/components/TaskFormFields.tsx
import React from 'react';
import { RenderField, Field } from '../components/RenderField';

interface TaskFormFieldsProps {
    taskName: string;
    setTaskName: (name: string) => void;
    selectedFieldIds: string[];
    allFields: Field[];
    fieldValues: Record<string, string>;
    handleFieldChange: (fieldId: string, newValue: string) => void;
    fieldUrlOptions: Record<string, string>;
    handleUrlOptionChange: (fieldId: string, option: string) => void;
}

const TaskFormFields: React.FC<TaskFormFieldsProps> = ({
    taskName,
    setTaskName,
    selectedFieldIds,
    allFields,
    fieldValues,
    handleFieldChange,
    fieldUrlOptions,
    handleUrlOptionChange,
}) => {
    return (
        <>
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
                const field = allFields.find((f) => f.id === fieldId);
                if (!field) {
                    console.warn('[TaskFormFields] No field definition found for fieldId:', fieldId);
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
        </>
    );
};

export default TaskFormFields;