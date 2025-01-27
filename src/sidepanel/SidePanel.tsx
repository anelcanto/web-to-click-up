// src/sidepanel/SidePanel.tsx
import React, { useState, useEffect } from 'react';
import CreateTask from './CreateTask';
import SettingsPanel from './SettingsPanel';
import { Field } from '../components/RenderField';
import NavButton from '../components/NavButton';

export default function SidePanel() {
    const [isSettings, setIsSettings] = useState(false);
    // Store selected fields as string IDs
    const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
    const [availableFields, setAvailableFields] = useState<Field[]>([]);

    // Load stored values from chrome storage on mount
    useEffect(() => {
        chrome.storage.local.get(['selectedFieldIds', 'availableFields'], (items) => {
            if (items.selectedFieldIds) {
                setSelectedFieldIds(items.selectedFieldIds);
            }
            if (items.availableFields) {
                setAvailableFields(items.availableFields);
            }
        });
    }, []);

    // Function to update fields (both selectedFieldIds and availableFields)
    const updateFields = (newSelectedFieldIds: string[], newAvailableFields: Field[]) => {
        setSelectedFieldIds(newSelectedFieldIds);
        setAvailableFields(newAvailableFields);
    };

    function reloadExtension() {
        chrome.runtime.sendMessage({ action: 'reloadExtension' })
    }

    return (
        <div>
            <button
                onClick={reloadExtension}
                className="w-full mb-2 p-2  text-gray rounded hover:bg-blue-700 transition"
            >
                Reload extension
            </button>

            <NavButton
                label={isSettings ? 'Back to Create Task' : 'Settings'}
                icon={isSettings ? 'back' : 'settings'}
                onClick={() => setIsSettings((prev) => !prev)}
            />

            {isSettings ? (
                <SettingsPanel
                    onGoToCreateTask={() => setIsSettings(false)}
                    selectedFieldIds={selectedFieldIds}
                    availableFields={availableFields}
                    updateFields={updateFields}
                    setSelectedFieldIds={setSelectedFieldIds}
                />
            ) : (
                <CreateTask
                    onGoToSettings={() => setIsSettings(true)}
                    selectedFieldIds={selectedFieldIds}
                    availableFields={availableFields}
                />
            )}
        </div>
    );
}