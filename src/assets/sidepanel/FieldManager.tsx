// src/assets/sidepanel/FieldManager.tsx
import React, { useState, useMemo, useEffect } from 'react';

interface Field {
    id: string;
    name: string;
}

interface FieldManagerProps {
    availableFields: Field[];
    initialSelectedFields: string[];
    onSave: (selectedFieldIds: string[], availableFields: Field[]) => void;
}

export default function FieldManager({
    availableFields,
    initialSelectedFields,
    onSave,
}: FieldManagerProps) {
    const [selectedFields, setSelectedFields] = useState<string[]>(initialSelectedFields);

    // Update selectedFields when initialSelectedFields prop changes
    useEffect(() => {
        setSelectedFields(initialSelectedFields);
    }, [initialSelectedFields]);

    // Sort fields by name
    const sortedFields = useMemo(() => {
        return [...availableFields].sort((a, b) => a.name.localeCompare(b.name));
    }, [availableFields]);

    function handleAddField() {
        setSelectedFields((prev) => [...prev, '']);
    }

    function handleFieldChange(index: number, newValue: string) {
        setSelectedFields((prev) => {
            const copy = [...prev];
            copy[index] = newValue;
            return copy;
        });
    }

    function handleRemoveField(index: number) {
        setSelectedFields((prev) => prev.filter((_, i) => i !== index));
    }

    function handleSave() {
        // Filter out empty selections
        const finalFields = selectedFields.filter((id) => id.trim() !== '');
        onSave(finalFields, availableFields); // Pass both selectedFieldIds and availableFields
    }

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
                <button
                    type="button"
                    onClick={handleSave}
                    className="flex-1 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    Save
                </button>
            </div>
        </div>
    );
}