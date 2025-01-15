// You can place this function in a separate file if you prefer.
import React from 'react';

interface FieldOption {
    id: string;
    name: string;
}

export interface Field {
    id: string;
    name: string;
    type?: string;
    options?: FieldOption[];
}

// Define props for the Field component rendering:
interface RenderFieldProps {
    field: Field;
    value: string;
    onChange: (fieldId: string, value: string) => void;
}

export const RenderField: React.FC<RenderFieldProps> = ({ field, value, onChange }) => {
    // A helper function to wrap common class names for inputs
    const inputClass =
        "w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500";

    switch (field.type) {
        case 'url':
            return (
                <input
                    type="url"
                    placeholder={field.name}
                    value={value}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className={inputClass}
                />
            );

        case 'drop_down':
            return (
                <select
                    value={value}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className={inputClass}
                >
                    <option value="">Select {field.name}...</option>
                    {field.options?.map((option: FieldOption) => (
                        <option key={option.id} value={option.id}>
                            {option.name}
                        </option>
                    ))}
                </select>
            );

        case 'labels':
            // If labels mean a multi-select, you could use a comma-separated input
            return (
                <input
                    type="text"
                    placeholder={`Enter labels for ${field.name} (comma separated)`}
                    value={value}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className={inputClass}
                />
            );

        case 'email':
            return (
                <input
                    type="email"
                    placeholder={field.name}
                    value={value}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className={inputClass}
                />
            );

        case 'phone':
            return (
                <input
                    type="tel"
                    placeholder={field.name}
                    value={value}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className={inputClass}
                />
            );

        case 'date':
            // Use datetime-local if date and time are needed
            return (
                <input
                    type="datetime-local"
                    placeholder={field.name}
                    value={value}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className={inputClass}
                />
            );

        case 'short_text':
            return (
                <input
                    type="text"
                    placeholder={field.name}
                    value={value}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className={inputClass}
                />
            );

        case 'text':
            return (
                <textarea
                    placeholder={field.name}
                    value={value}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className={inputClass}
                />
            );

        case 'checkbox':
            return (
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={value === 'true'}
                        onChange={(e) => onChange(field.id, e.target.checked.toString())}
                        className="mr-2"
                    />
                    <span>{field.name}</span>
                </div>
            );

        case 'number':
            return (
                <input
                    type="number"
                    placeholder={field.name}
                    value={value}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className={inputClass}
                />
            );

        case 'currency':
            return (
                <input
                    type="number"
                    placeholder={field.name}
                    value={value}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className={inputClass}
                    step="0.01"
                />
            );

        case 'tasks':
            // If tasks is a linked task type, you could allow comma separated task IDs or use a multi-select:
            return (
                <input
                    type="text"
                    placeholder={`Enter task IDs for ${field.name} (comma separated)`}
                    value={value}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className={inputClass}
                />
            );

        case 'users':
            // Assuming users is a multi-select; you may need a custom component.
            return (
                <input
                    type="text"
                    placeholder={`Enter user IDs for ${field.name} (comma separated)`}
                    value={value}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className={inputClass}
                />
            );

        case 'emoji':
            // A simple input for emoji ratings. You might later replace this with a more graphical selector.
            return (
                <input
                    type="text"
                    placeholder={`Enter emoji rating for ${field.name}`}
                    value={value}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className={inputClass}
                />
            );

        case 'automatic_progress':
            // Render as a read-only progress indicator or a simple display.
            return (
                <input
                    type="text"
                    placeholder={field.name}
                    value={value}
                    readOnly
                    className={inputClass}
                />
            );

        case 'manual_progress':
            // Use a range input so the user can adjust progress
            return (
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={value || 0}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className={inputClass}
                />
            );

        case 'location':
            return (
                <input
                    type="text"
                    placeholder={field.name}
                    value={value}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className={inputClass}
                />
            );

        default:
            // If field type is unrecognized, default to text input
            return (
                <input
                    type="text"
                    placeholder={field.name}
                    value={value}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className={inputClass}
                />
            );
    }
};