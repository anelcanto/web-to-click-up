// src/sidepanel/SettingsPanel.tsx
import React, { useEffect, useState, useRef } from 'react';
import FieldManager, { FieldManagerRef } from './FieldManager';
import { Field } from '../components/RenderField';
import LocationSelectors from '../components/LocationSelectors';
import { Settings } from '../types';
import OAuthButton from '../components/OAuthButton';
import useDebounce from '../hooks/useDebounce';
import AutoSaveStatus from '../components/AutoSaveStatus';

interface SettingsPanelProps {
    onGoToCreateTask: () => void;
    selectedFieldIds: string[]; // Array of field IDs (string[])
    availableFields: Field[];
    updateFields: (newSelectedFieldIds: string[], newAvailableFields: Field[]) => void;
    setSelectedFieldIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function SettingsPanel({
    onGoToCreateTask,
    selectedFieldIds,
    availableFields,
    updateFields,
    setSelectedFieldIds,
}: SettingsPanelProps) {
    const [settings, setSettings] = useState<Settings>({
        apiToken: '',
        selectedTeam: '',
        selectedSpace: '',
        selectedFolder: null,
        selectedList: '',
        fieldMappings: {},
    });

    // const [settingsStatus, setSettingsStatus] = useState('');
    const fieldManagerRef = useRef<FieldManagerRef>(null);
    const isFirstRender = useRef(true);

    useEffect(() => {
        chrome.storage.local.get(
            ['apiToken', 'selectedTeam', 'selectedSpace', 'selectedFolder', 'selectedList', 'fieldMappings'],
            (items) => {
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

    const standardFields: Field[] = [
        { id: 'taskDescription', name: 'Task Description' },
    ];
    const combinedFields: Field[] = [...standardFields, ...availableFields];

    const [isSyncing, setSyncStatus] = useState(false);



    const DEBOUNCE_DELAY = 1000; // 1 second
    const debouncedSettings = useDebounce(settings, DEBOUNCE_DELAY);

    // const MIN_DISPLAY_TIME = 1000; // 1 second
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return; // Skip the first render
        }

        saveSettings();

        async function saveSettings() {
            setSyncStatus(true); // Start syncing
            console.log("Saving settings.. ")
            let finalIds = selectedFieldIds;
            let finalFields = availableFields;

            if (fieldManagerRef.current?.handleSave) {
                const { finalIds: ids, finalFields: fields } = await fieldManagerRef.current.handleSave();
                updateFields(ids, fields);
                finalIds = ids;
                finalFields = fields;
            }

            chrome.storage.local.set(
                {
                    apiToken: settings.apiToken,
                    selectedTeam: settings.selectedTeam,
                    selectedSpace: settings.selectedSpace,
                    selectedFolder: settings.selectedFolder,
                    selectedList: settings.selectedList,
                    fieldMappings: settings.fieldMappings,
                    selectedFieldIds: finalIds,
                    availableFields: finalFields.map((field) => ({
                        id: field.id,
                        name: field.name,
                        type: field.type || 'text',
                        options:
                            field.type === 'drop_down'
                                ? field.options?.map((opt) => ({ id: opt.id, name: opt.name }))
                                : undefined,
                    })),
                },
                () => {
                    if (chrome.runtime.lastError) {
                        console.error('Error saving settings:', chrome.runtime.lastError);
                    }
                    //  else {
                    //     setSettingsStatus('Settings saved.');
                    // }

                    // Switch sync animation after a delay
                    setTimeout(() => {
                        setSyncStatus(false); // End syncing
                        // setSettingsStatus(''); // Clear the status message
                    }, 2000);
                }
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSettings, selectedFieldIds]);

    return (

        <div className="relative p-4 w-72 font-sans">


            <AutoSaveStatus
                isSyncing={isSyncing}
                className={"absolute top-0 right-3"}
            />
            <h3 className="text-lg font-bold mb-4">Settings</h3>

            <OAuthButton
                settings={settings}
                setSettings={setSettings}
                clearSelectedFields={() => setSelectedFieldIds([])} // Pass the clear callback here.
            />

            <LocationSelectors
                settings={settings}
                setSettings={setSettings}
                selectedFieldIds={selectedFieldIds}
                updateFields={updateFields}
            />

            {combinedFields.length > 0 && (
                <FieldManager
                    availableFields={combinedFields}
                    selectedFields={selectedFieldIds}
                    setSelectedFields={setSelectedFieldIds}
                />
            )}


            {/* <p className="text-sm text-gray-700">{settingsStatus}</p> */}

            <hr className="my-4" />

            <button
                onClick={onGoToCreateTask}
                className="w-full p-2 text-blue-700 underline hover:text-blue-900"
            >
                Back to Create Task
            </button>
        </div>
    );
}