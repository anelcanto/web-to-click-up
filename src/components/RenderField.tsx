// src/assets/components/RenderField.tsx
import React, { useEffect } from 'react';

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

interface RenderFieldProps {
    field: Field;
    value: string;
    onChange: (fieldId: string, value: string) => void;
    // New optional props for URL fields:
    urlOption?: string; // "manual" or "current"
    onUrlOptionChange?: (fieldId: string, option: string) => void;
}

export const RenderField: React.FC<RenderFieldProps> = ({ field, value, onChange, urlOption, onUrlOptionChange }) => {
    const inputClass = "w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500";
    console.log(`[RenderField] Rendering field id: ${field.id}, type: ${field.type}, current value: ${value}`);

    // useEffect for URL fetching when "current" is selected.
    useEffect(() => {
        if (field.type === 'url' && urlOption === "current") {
            console.log(`[RenderField/useEffect] URL option is "current" for field ${field.id}. Fetching current tab URL...`);
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                console.log(`[RenderField/useEffect] chrome.tabs.query result for field ${field.id}:`, tabs);
                if (tabs && tabs.length > 0 && tabs[0].url) {
                    const fetchedUrl = tabs[0].url;
                    // Only trigger onChange if the fetched URL differs from the current value.
                    if (fetchedUrl !== value) {
                        console.log(`[RenderField/useEffect] Fetched URL "${fetchedUrl}" differs from current value "${value}". Calling onChange...`);
                        onChange(field.id, fetchedUrl);
                    } else {
                        console.log(`[RenderField/useEffect] Fetched URL is identical to current value. No action needed.`);
                    }
                } else {
                    console.warn(`[RenderField/useEffect] No URL found for field ${field.id}.`);
                }
            });
        }
    }, [urlOption, field, onChange, value]);

    // Handler for when the URL option select changes.
    const handleUrlOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOption = e.target.value;
        console.log(`[RenderField] handleUrlOptionChange: Selected "${selectedOption}" for field ${field.id}`);
        if (onUrlOptionChange) {
            onUrlOptionChange(field.id, selectedOption);
        }
        // If switching back to manual, clear the URL if desired.
        if (selectedOption === "manual") {
            onChange(field.id, '');
        }
    };

    if (field.type === 'url') {
        return (
            <div className="space-y-1">
                <label className="block text-sm font-medium mb-1">{field.name}</label>
                <input
                    type="url"
                    placeholder={field.name}
                    value={value}
                    disabled={urlOption === "current"}
                    onChange={(e) => {
                        console.log(`[RenderField] Manual URL change for field ${field.id}:`, e.target.value);
                        onChange(field.id, e.target.value);
                    }}
                    className={inputClass}
                />
                <select
                    onChange={handleUrlOptionChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={urlOption || "manual"}
                >
                    <option value="manual">Enter URL manually</option>
                    <option value="current">Use current page URL</option>
                </select>
            </div>
        );
    }

    // Other field types (unchanged)
    switch (field.type) {
        case 'drop_down':
            return (
                <select
                    value={value}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className={inputClass}
                >
                    <option value="">Select {field.name}...</option>
                    {field.options?.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.name}
                        </option>
                    ))}
                </select>
            );
        case 'labels':
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