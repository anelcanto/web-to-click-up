// src/assets/sidepanel/SettingsPanel.tsx
/* eslint no-unused-vars: "off" */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import FieldManager, { FieldManagerRef } from './FieldManager';


interface SettingsPanelProps {
    onGoToCreateTask: () => void;
    selectedFieldIds: string[];
    availableFields: Field[];
    updateFields: (selectedFieldIds: string[], availableFields: Field[]) => void;
}

interface Settings {
    // Basic
    apiToken?: string;

    // Selected Entities
    selectedTeam?: string;
    selectedSpace?: string;
    selectedFolder?: string | null;
    selectedList?: string;

    // Custom Field Mappings
    fieldMappings?: Record<string, string>;
}

interface Team {
    id: string;
    name: string;
}

interface Space {
    id: string;
    name: string;
}

interface Folder {
    id: string;
    name: string;
}

interface List {
    id: string;
    name: string;
}


interface Field {
    id: string;
    name: string;
    type?: string; // E.g., 'drop_down'
    options?: { id: string; name: string }[]; // For dropdown options
}



export default function SettingsPanel({
    onGoToCreateTask,
    selectedFieldIds,
    availableFields,
    updateFields,
}: SettingsPanelProps) {
    // UI Data
    const [teams, setTeams] = useState<Team[]>([]);
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [lists, setLists] = useState<List[]>([]);



    // UI states
    const [apiTokenVisible, setApiTokenVisible] = useState(false);
    const [settingsStatus, setSettingsStatus] = useState('');

    // Combined Settings
    const [settings, setSettings] = useState<Settings>({
        apiToken: '',
        selectedTeam: '',
        selectedSpace: '',
        selectedFolder: null,
        selectedList: '',
        fieldMappings: {},
    });




    // Create a ref for FieldManager
    const fieldManagerRef = useRef<FieldManagerRef>(null);

    useEffect(() => {
        loadSettings();

        function loadSettings() {
            chrome.storage.local.get(
                ['apiToken', 'selectedTeam', 'selectedSpace', 'selectedFolder', 'selectedList'],
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

        }
    }, []);

    // Fetch Teams
    useEffect(() => {
        if (settings.apiToken) {
            fetchTeams();
        }

        function fetchTeams() {
            console.log('fetching teams');
            console.log(`settings.apiToken: ${settings.apiToken}`);
            fetch('https://api.clickup.com/api/v2/team', {
                headers: { Authorization: settings.apiToken || '' },
            })
                .then(res => res.json())
                .then(data => {
                    if (data.teams) {
                        setTeams(data.teams);
                    }
                })
                .catch(err => console.error(err));
        }
    }, [settings.apiToken]);

    const handleSelectTeam = useCallback((teamId: string) => {
        console.log('handleSelectTeams');
        console.log('teams:', teams);
        console.log('(selected team)teamId:', teamId);
        setSettings(prev => ({ ...prev, selectedTeam: teamId }));

        if (!teamId) return; // Don't fetch spaces if teamId is empty
        fetch(`https://api.clickup.com/api/v2/team/${teamId}/space`, {
            headers: { Authorization: settings.apiToken || '' },
        })
            .then(res => res.json())
            .then(data => setSpaces(data.spaces || []))
            .catch(err => console.error(err));
    }, [settings.apiToken, teams]);

    useEffect(() => {
        if (teams.length > 0 && settings.selectedTeam) {
            handleSelectTeam(settings.selectedTeam);
        }
    }, [teams, settings.selectedTeam, handleSelectTeam]);

    const handleSelectSpace = useCallback((spaceId: string) => {
        setSettings((prev) => {
            // If user is actually changing the space, reset folder+list
            if (prev.selectedSpace != spaceId) {
                return { ...prev, selectedSpace: spaceId, selectedFolder: null, selectedList: '' };
            } else {
                // same space as before—don t wipe out the folder/list
                return { ...prev, selectedSpace: spaceId };
            }
        });

        if (!spaceId) return;
        // 1. Fetch folders in the chosen space
        fetch(`https://api.clickup.com/api/v2/space/${spaceId}/folder?archived=false`, {
            headers: { Authorization: settings.apiToken || '' },
        })
            .then((res) => res.json())
            .then((data) => {
                setFolders(data.folders || []);
            })
            .catch((err) => console.error(err));

        // 2. Fetch folderless lists in the chosen space
        fetch(`https://api.clickup.com/api/v2/space/${spaceId}/list?archived=false`, {
            headers: { Authorization: settings.apiToken || '' },
        })
            .then((res) => res.json())
            .then((data) => {
                setLists(data.lists || []);
            })
            .catch((err) => console.error(err));
    }, [settings.apiToken]);

    useEffect(() => {
        console.log(`selectedSpace: ${settings.selectedSpace}`);
        console.log('spaces:', spaces);
        if (spaces.length > 0 && settings.selectedSpace) {
            handleSelectSpace(settings.selectedSpace);
        }
    }, [spaces, settings.selectedSpace, handleSelectSpace]);

    // Handle Selecting Folder → fetch Lists
    const handleSelectFolder = useCallback((folderId: string) => {
        setSettings(prev => ({
            ...prev,
            selectedFolder: folderId,
            selectedList: prev.selectedList || '', // Only clear selectedList if it's not already set
        }));

        if (!folderId) return;
        fetch(`https://api.clickup.com/api/v2/folder/${folderId}/list`, {
            headers: { Authorization: settings.apiToken || '' },
        })
            .then(res => res.json())
            .then(data => {
                console.log("data.lists", data.lists)
                setLists(data.lists || []);
            })
            .catch(err => console.error(err));
    }, [settings.apiToken]);

    // Once folders are loaded, if there's a saved selectedFolder, fetch the lists in that folder
    useEffect(() => {
        if (folders.length > 0 && settings.selectedFolder) {
            console.log('selected folder:', settings.selectedFolder);
            handleSelectFolder(settings.selectedFolder);
        }
    }, [folders, settings.selectedFolder, handleSelectFolder]);

    // Handle Selecting List → fetch Custom Fields
    const handleSelectList = useCallback((listId: string) => {
        setSettings((prev) => ({
            ...prev,
            selectedList: listId,
        }));

        if (!listId) return;
        fetch(`https://api.clickup.com/api/v2/list/${listId}/field`, {
            headers: { Authorization: settings.apiToken || '' },
        })
            .then((res) => res.json())
            .then((data) => {
                console.log("data.fields", data.fields)
                const newAvailableFields = data.fields?.map((field: any) => ({
                    id: field.id,
                    name: field.name,
                    type: field.type,
                    options: field.type == 'drop_down' ? field.type_config.options : undefined,
                })) || [];
                updateFields(selectedFieldIds, newAvailableFields);
            })
            .catch((err) => console.error(err));
    }, [settings.apiToken, selectedFieldIds, updateFields]);

    // // Once lists are loaded, if there's a saved selectedList, fetch the custom fields for that list
    // useEffect(() => {
    //     console.log("LIST useEffect triggered");
    //     if (lists.length > 0 && settings.selectedList) {
    //         handleSelectList(settings.selectedList);
    //     }
    // }, [lists, settings.selectedList, handleSelectList]);

    const hasLoadedCustomFields = useRef(false);

    useEffect(() => {
        if (!settings.selectedList) return;
        if (!hasLoadedCustomFields.current) {
            handleSelectList(settings.selectedList);
            hasLoadedCustomFields.current = true;
        }
    }, [settings.selectedList, handleSelectList]);



    const standardFields: Field[] = [
        { id: 'taskDescription', name: 'Task Description' },
        // { id: 'taskStatus', name: 'Task Status' },
        // { id: 'taskAssignee', name: 'Task Assignee' },
        // Add more standard fields as needed
    ];

    const combinedFields: Field[] = [
        ...standardFields,
        ...availableFields, // from ClickUp
    ];

    function saveSettings() {
        // Call handleSave from FieldManager
        fieldManagerRef.current?.handleSave();

        // After saving fields, proceed to save other settings
        // Transform combinedFields to include only id and name
        const minimalFields = combinedFields.map(field => ({
            id: field.id,
            name: field.name,
            type: field.type || 'text',
            options: field.options,
        }));
        console.log('field:', minimalFields)


        chrome.storage.local.set({
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
                options: field.type === 'drop_down' ? field.options?.map(opt => ({
                    id: opt.id,
                    name: opt.name
                })) : undefined,
            })),

        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving settings:', chrome.runtime.lastError);
            } else {
                setSettingsStatus('Settings saved.');
            }
        });
    }



    const toggleApiTokenVisibility = () => {
        setApiTokenVisible((prev) => !prev)
    }

    return (
        <div className="p-4 w-72 font-sans">
            <h3 className="text-lg font-bold mb-4">Settings</h3>

            <div>
                {/* API Token Field */}
                <div className="flex items-center space-x-2" >

                    <input
                        type={apiTokenVisible ? 'text' : 'password'}
                        value={settings.apiToken}
                        onChange={(e) => setSettings({ ...settings, apiToken: e.target.value })}
                        placeholder="ClickUp API Key"
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={toggleApiTokenVisibility}
                        className="p-2 bg-gray-200 rounded hover:bg-gray-300"
                        aria-label="Toggle API Token Visibility"
                    >
                        {apiTokenVisible ? 'Hide' : 'Show'}
                    </button>
                </div>

                {/* Dropdown: Teams */}
                <select
                    value={settings.selectedTeam}
                    onChange={(e) => handleSelectTeam(e.target.value)}
                    className="w-full p-2 border rounded mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Select a Workspace...</option>
                    {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                            {team.name}
                        </option>
                    ))}
                </select>
                {/* Dropdown: Spaces */}
                <select
                    value={settings.selectedSpace}
                    onChange={(e) => handleSelectSpace(e.target.value)}
                    className="w-full p-2 border rounded mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Select a Space...</option>
                    {spaces.map((space) => (
                        <option key={space.id} value={space.id}>
                            {space.name}
                        </option>
                    ))}
                </select>

                {/* Folders */}
                <select
                    value={settings.selectedFolder || ''}
                    onChange={(e) => handleSelectFolder(e.target.value)}
                    className="w-full p-2 border rounded mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">(No Folder)</option>
                    {folders.map((folder) => (
                        <option key={folder.id} value={folder.id}>
                            {folder.name}
                        </option>
                    ))}
                </select>

                {/* Lists */}
                <select
                    value={settings.selectedList}
                    onChange={(e) => handleSelectList(e.target.value)}
                    className="w-full p-2 border rounded mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Select a List...</option>
                    {lists.map((list) => (
                        <option key={list.id} value={list.id}>
                            {list.name}
                        </option>
                    ))}
                </select>

                {/* Field Manager */}
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
                <div className="pb-2"></div>

                {/* Save Settings */}
                <button onClick={saveSettings} className="w-full mb-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                    Save Settings
                </button>
                <p className="text-sm text-gray-700">{settingsStatus}</p>

                <hr className="my-4" />

                <button onClick={onGoToCreateTask} className="w-full p-2 text-blue-700 underline hover:text-blue-900">
                    Back to Create Task
                </button>
            </div>
        </div>
    );
}