// src/sidepanel/FieldManager.tsx
import React, { useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Field } from '../components/RenderField';

export interface FieldManagerProps {
    availableFields: Field[];
    selectedFields: string[]; // should be a list of field IDs (strings)
    setSelectedFields: React.Dispatch<React.SetStateAction<string[]>>;
    resetTrigger?: boolean; // Optional prop to trigger a reset
}

export interface FieldManagerRef {
    handleSave: () => Promise<{ finalIds: string[]; finalFields: Field[] }>;
}

const FieldManager = forwardRef<FieldManagerRef, FieldManagerProps>(({
    availableFields,
    selectedFields,
    setSelectedFields,
    resetTrigger,
}, ref) => {
    // Reset selectedFields state when resetTrigger is activated.
    useEffect(() => {
        if (resetTrigger) {
            setSelectedFields([]);
        }
    }, [resetTrigger, setSelectedFields]);

    // Sort fields alphabetically based on name.
    const sortedFields = useMemo(() => {
        return [...availableFields].sort((a, b) => a.name.localeCompare(b.name));
    }, [availableFields]);

    // Add an empty field entry.
    function handleAddField() {
        setSelectedFields((prev) => [...prev, '']);
    }

    // Update a field's value.
    function handleFieldChange(index: number, newValue: string) {
        setSelectedFields((prev) => {
            const copy = [...prev];
            copy[index] = newValue;
            return copy;
        });
    }

    // Remove a field from the selection.
    function handleRemoveField(index: number) {
        setSelectedFields((prev) => prev.filter((_, i) => i !== index));
    }

    // Expose the handleSave function to the parent via ref.
    useImperativeHandle(ref, () => ({
        handleSave
    }));

    // Compile final field information.
    const handleSave = (): Promise<{ finalIds: string[]; finalFields: Field[] }> => {
        return new Promise((resolve) => {
            const finalFields = selectedFields
                .filter(id => id.trim() !== '')
                .map(id => {
                    const field = availableFields.find(f => f.id === id);
                    return field ? { ...field } : null;
                })
                .filter((f): f is Field => Boolean(f));
            resolve({
                finalIds: finalFields.map(f => f.id),
                finalFields,
            });
        });
    };

    return (
        <div className="mt-4">
            <h4 className="font-bold mb-2">Field Manager</h4>
            {selectedFields.map((fieldId, i) => (
                <div key={i} className="flex gap-2 my-1">
                    <select
                        value={fieldId}
                        onChange={(e) => handleFieldChange(i, e.target.value)}
                        className="w-full p-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">-- Select a field --</option>
                        {sortedFields.map((f) => (
                            <option key={f.id} value={f.id}>
                                {f.name}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={() => handleRemoveField(i)}
                        className="text-red-600 hover:text-red-800"
                        aria-label="Remove Field"
                    >
                        Remove
                    </button>
                </div>
            ))}
            <div className="flex gap-2 mt-2">
                <button
                    type="button"
                    onClick={handleAddField}
                    className="flex-1 p-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                    Add Field
                </button>
            </div>
        </div>
    );
});

export default FieldManager;