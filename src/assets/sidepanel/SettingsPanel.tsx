// src/assets/sidepanel/SettingsPanel.tsx
/* eslint no-unused-vars: "off" */

import React, { useEffect, useState } from 'react';
import FieldManager from './FieldManager';

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

interface CustomField {
    id: string;
    name: string;
}

interface Field {
    id: string;
    name: string;
}

const standardFields: Field[] = [
    { id: 'taskDescription', name: 'Task Description' },
    { id: 'taskStatus', name: 'Task Status' },
    { id: 'taskAssignee', name: 'Task Assignee' },
    // Add more standard fields as needed
];

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

    // Combined Settings
    const [settings, setSettings] = useState<Settings>({
        apiToken: '',
        selectedTeam: '',
        selectedSpace: '',
        selectedFolder: null,
        selectedList: '',
        fieldMappings: {},
    });

    // UI states
    const [apiTokenVisible, setApiTokenVisible] = useState(false);
    const [settingsStatus, setSettingsStatus] = useState('');
    const combinedFields: Field[] = [
        ...standardFields,
        ...availableFields, // from ClickUp
    ];

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        if (settings.apiToken) {
            fetchTeams();
        }
    }, [settings.apiToken]);

    useEffect(() => {
        if (teams.length > 0 && settings.selectedTeam) {
            handleSelectTeam(settings.selectedTeam);
        }
    }, [teams]);

    // Once spaces are loaded, if there's a saved selectedSpace, fetch folders and folderless lists
    useEffect(() => {
        if (spaces.length > 0 && settings.selectedSpace) {
            handleSelectSpace(settings.selectedSpace);
        }
    }, [spaces]);

    // Once folders are loaded, if there's a saved selectedFolder, fetch the lists in that folder
    useEffect(() => {
        if (folders.length > 0 && settings.selectedFolder) {
            handleSelectFolder(settings.selectedFolder);
        }
    }, [folders]);

    // Once lists are loaded, if there's a saved selectedList, fetch the custom fields for that list
    useEffect(() => {
        if (lists.length > 0 && settings.selectedList) {
            handleSelectList(settings.selectedList);
        }
    }, [lists]);

    // Handle Selecting Team → fetch Spaces
    function handleSelectTeam(teamId: string) {
        setSettings(prev => ({ ...prev, selectedTeam: teamId }));
        fetch(`https://api.clickup.com/api/v2/team/${teamId}/space`, {
            headers: { Authorization: settings.apiToken || '' },
        })
            .then(res => res.json())
            .then(data => setSpaces(data.spaces || []))
            .catch(err => console.error(err));
    }

    // Handle Selecting Space → fetch Folders + Folderless Lists
    function handleSelectSpace(spaceId: string) {
        setSettings((prev) => {
            // If user is actually changing the space, reset folder+list
            if (prev.selectedSpace !== spaceId) {
                return { ...prev, selectedSpace: spaceId, selectedFolder: null, selectedList: '' };
            } else {
                // same space as before—don’t wipe out the folder/list
                return { ...prev, selectedSpace: spaceId };
            }
        });

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
    }

    // Handle Selecting Folder → fetch Lists
    function handleSelectFolder(folderId: string) {
        setSettings(prev => ({
            ...prev,
            selectedFolder: folderId,
            selectedList: prev.selectedList || '', // Only clear selectedList if it's not already set
        }));
        fetch(`https://api.clickup.com/api/v2/folder/${folderId}/list`, {
            headers: { Authorization: settings.apiToken || '' },
        })
            .then(res => res.json())
            .then(data => setLists(data.lists || []))
            .catch(err => console.error(err));
    }

    // Handle Selecting List → fetch Custom Fields
    function handleSelectList(listId: string) {
        setSettings(prev => ({ ...prev, selectedList: listId }));
        fetch(`https://api.clickup.com/api/v2/list/${listId}/field`, {
            headers: { Authorization: settings.apiToken || '' },
        })
            .then(res => res.json())
            .then(data => {
                const newAvailableFields = data.fields || [];
                updateFields(selectedFieldIds, newAvailableFields);
            })
            .catch(err => console.error(err));
    }

    function loadSettings() {
        chrome.storage.local.get(
            ['apiToken', 'selectedTeam', 'selectedSpace', 'selectedFolder', 'selectedList'],
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
    }

    function saveSettings() {
        // Transform combinedFields to include only id and name
        const minimalFields = combinedFields.map(field => ({
            id: field.id,
            name: field.name,
        }));

        chrome.storage.local.set({
            apiToken: settings.apiToken,
            selectedTeam: settings.selectedTeam,
            selectedSpace: settings.selectedSpace,
            selectedFolder: settings.selectedFolder,
            selectedList: settings.selectedList,
            fieldMappings: settings.fieldMappings,
            selectedFieldIds: selectedFieldIds, // Add these
            availableFields: minimalFields, // Save optimized fields
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving settings:', chrome.runtime.lastError);
                setSettingsStatus('Error saving settings. Please try again.');
            } else {
                setSettingsStatus('Settings saved.');
                setTimeout(() => setSettingsStatus(''), 1500);
            }
        });
    }

    // Fetch Teams
    function fetchTeams() {
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

    const toggleApiTokenVisibility = () => {
        setApiTokenVisible((prev) => !prev)
    }

    return (
        <div className="p-4 w-72 font-sans">
            <h3 className="text-lg font-bold mb-4">Settings</h3>

            <div>
                {/* API Token Field */}
                <div className="flex items-center space-x-2">
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
                        availableFields={combinedFields}
                        initialSelectedFields={selectedFieldIds}
                        onSave={(finalIds: string[], newAvailableFields: Field[]) => {
                            updateFields(finalIds, newAvailableFields);
                        }}
                    />
                )}

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