// src/assets/sidepanel/SettingsPanel.tsx
/* eslint no-unused-vars: "off" */

import React, { useEffect, useState, useRef } from 'react';
import FieldManager, { FieldManagerRef } from './FieldManager';
import { Field } from '../components/RenderField';
import LocationSelectors from '../components/LocationSelectors'; // <-- Import our new component

interface SettingsPanelProps {
    onGoToCreateTask: () => void;
    selectedFieldIds: string[];
    availableFields: Field[];
    updateFields: (selectedFieldIds: string[], availableFields: Field[]) => void;
}

// The settings type
interface Settings {
    apiToken?: string;
    selectedTeam?: string;
    selectedSpace?: string;
    selectedFolder?: string | null;
    selectedList?: string;
    fieldMappings?: Record<string, string>;
}

export default function SettingsPanel({
    onGoToCreateTask,
    selectedFieldIds,
    availableFields,
    updateFields,
}: SettingsPanelProps) {
    // Combined Settings
    const [settings, setSettings] = useState<Settings>({
        apiToken: '',
        selectedTeam: '',
        selectedSpace: '',
        selectedFolder: null,
        selectedList: '',
        fieldMappings: {},
    });

    // For showing status after saving
    const [settingsStatus, setSettingsStatus] = useState('');

    // Reference to the FieldManager
    const fieldManagerRef = useRef<FieldManagerRef>(null);

    // Load stored settings on mount
    useEffect(() => {
        chrome.storage.local.get(
            ['apiToken', 'selectedTeam', 'selectedSpace', 'selectedFolder', 'selectedList', 'fieldMappings'],
            (items) => {
                console.log('Loaded items:', items);
                setSettings({
                    apiToken: items.apiToken || '',
                    selectedTeam: items.selectedTeam || '',
                    selectedSpace: items.selectedSpace || '',
                    selectedFolder: items.selectedFolder ?? null,
                    selectedList: items.selectedList || '',
                    fieldMappings: items.fieldMappings || {},
                });
            }
        );
    }, []);

    // A set of standard fields you always want available
    const standardFields: Field[] = [
        { id: 'taskDescription', name: 'Task Description' },
        // Potentially add more...
    ];

    // Combine standard + custom from ClickUp
    const combinedFields: Field[] = [
        ...standardFields,
        ...availableFields,
    ];

    // Save settings (including fields) to Chrome storage
    function saveSettings() {
        // Call handleSave from FieldManager to ensure fields are up-to-date
        fieldManagerRef.current?.handleSave();

        // Minimal fields data for saving
        const minimalFields = combinedFields.map(field => ({
            id: field.id,
            name: field.name,
            type: field.type || 'text',
            options: field.options,
        }));

        // Now persist to storage
        chrome.storage.local.set(
            {
                apiToken: settings.apiToken,
                selectedTeam: settings.selectedTeam,
                selectedSpace: settings.selectedSpace,
                selectedFolder: settings.selectedFolder,
                selectedList: settings.selectedList,
                fieldMappings: settings.fieldMappings,
                selectedFieldIds: selectedFieldIds,
                availableFields: minimalFields.map((field) => ({
                    id: field.id,
                    name: field.name,
                    type: field.type || 'text',
                    options:
                        field.type === 'drop_down'
                            ? field.options?.map(opt => ({ id: opt.id, name: opt.name }))
                            : undefined,
                })),
            },
            () => {
                if (chrome.runtime.lastError) {
                    console.error('Error saving settings:', chrome.runtime.lastError);
                } else {
                    setSettingsStatus('Settings saved.');
                }
            }
        );
    }

    // Example "Connect ClickUp" button (OAuth) – optional
    const handleConnectClickup = () => {
        chrome.runtime.sendMessage({ action: 'startOAuth' }, (response) => {
            if (response.success) {
                console.log('OAuth successful! Access token:', response.accessToken);
                // Save the token in your extension state or local storage
                setSettings((prev) => ({ ...prev, apiToken: response.accessToken }));
            } else {
                console.error('OAuth failed:', response.error);
            }
        });
    };

    return (
        <div className="p-4 w-72 font-sans">
            <h3 className="text-lg font-bold mb-4">Settings</h3>

            {/* Connect ClickUp (OAuth) */}
            <div className="flex items-center space-x-2 mb-2">
                <button
                    onClick={handleConnectClickup}
                    className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    Connect ClickUp
                </button>
            </div>

            {/* Location Selectors (teams/spaces/folders/lists) */}
            <LocationSelectors
                settings={settings}
                setSettings={setSettings}
                selectedFieldIds={selectedFieldIds}
                updateFields={updateFields}
            />

            {/* Field Manager (standard + custom fields) */}
            {combinedFields.length > 0 && (
                <FieldManager
                    ref={fieldManagerRef}
                    availableFields={combinedFields}
                    initialSelectedFields={selectedFieldIds}
                    onSave={(finalIds: string[], newAvailableFields: Field[]) => {
                        updateFields(finalIds, newAvailableFields);
                    }}
                />
            )}

            {/* Save Settings */}
            <button
                onClick={saveSettings}
                className="w-full mb-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
                Save Settings
            </button>
            <p className="text-sm text-gray-700">{settingsStatus}</p>

            <hr className="my-4" />

            {/* Back to Create Task Button */}
            <button
                onClick={onGoToCreateTask}
                className="w-full p-2 text-blue-700 underline hover:text-blue-900"
            >
                Back to Create Task
            </button>
        </div>
    );
}