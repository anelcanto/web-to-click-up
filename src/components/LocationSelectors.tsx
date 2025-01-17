// src/assets/sidepanel/LocationSelectors.tsx
/* eslint no-unused-vars: "off" */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Field } from './RenderField';

// Types for data
export interface Team {
    id: string;
    name: string;
}

export interface Space {
    id: string;
    name: string;
}

export interface Folder {
    id: string;
    name: string;
}

export interface List {
    id: string;
    name: string;
}

// This matches what you use in SettingsPanel
interface Settings {
    apiToken?: string;
    selectedTeam?: string;
    selectedSpace?: string;
    selectedFolder?: string | null;
    selectedList?: string;
    fieldMappings?: Record<string, string>;
}

// Props for LocationSelectors
interface LocationSelectorsProps {
    settings: Settings;                              // So we can read apiToken, etc.
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
    selectedFieldIds: string[];                      // From parent
    updateFields: (selectedFieldIds: string[], availableFields: Field[]) => void;
}

// The component
export default function LocationSelectors({
    settings,
    setSettings,
    selectedFieldIds,
    updateFields,
}: LocationSelectorsProps) {
    // Local state for the location data
    const [teams, setTeams] = useState<Team[]>([]);
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [lists, setLists] = useState<List[]>([]);

    // Used to prevent repeatedly loading custom fields when the list is already selected
    const hasLoadedCustomFields = useRef(false);

    /**
     * Fetch teams whenever apiToken is available
     */
    useEffect(() => {
        if (!settings.apiToken) return;

        console.log('Fetching teams with token:', settings.apiToken);
        fetch('https://api.clickup.com/api/v2/team', {
            headers: { Authorization: settings.apiToken },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.teams) {
                    setTeams(data.teams);
                }
            })
            .catch((err) => console.error('Error fetching teams:', err));
    }, [settings.apiToken]);

    /**
     * Handle user selecting a Team
     */
    const handleSelectTeam = useCallback(
        (teamId: string) => {
            // Update selectedTeam in the parent
            setSettings((prev) => ({
                ...prev,
                selectedTeam: teamId,
                // Clear out old selections
                selectedSpace: '',
                selectedFolder: null,
                selectedList: '',
            }));

            // If no team is selected, clear out spaces
            if (!teamId) {
                setSpaces([]);
                return;
            }

            // Fetch spaces for the chosen team
            fetch(`https://api.clickup.com/api/v2/team/${teamId}/space`, {
                headers: { Authorization: settings.apiToken || '' },
            })
                .then((res) => res.json())
                .then((data) => {
                    setSpaces(data.spaces || []);
                })
                .catch((err) => console.error('Error fetching spaces:', err));
        },
        [settings.apiToken, setSettings]
    );

    /**
     * If a saved `selectedTeam` is present, refetch its spaces on initial load
     */
    useEffect(() => {
        if (teams.length > 0 && settings.selectedTeam) {
            handleSelectTeam(settings.selectedTeam);
        }
    }, [teams, settings.selectedTeam, handleSelectTeam]);

    /**
     * Handle user selecting a Space
     */
    const handleSelectSpace = useCallback(
        (spaceId: string) => {
            // If the user changes the space, also reset folder + list
            setSettings((prev) => ({
                ...prev,
                selectedSpace: spaceId,
                selectedFolder: null,
                selectedList: '',
            }));

            if (!spaceId) {
                setFolders([]);
                setLists([]);
                return;
            }

            // 1. Fetch folders
            fetch(`https://api.clickup.com/api/v2/space/${spaceId}/folder?archived=false`, {
                headers: { Authorization: settings.apiToken || '' },
            })
                .then((res) => res.json())
                .then((data) => {
                    setFolders(data.folders || []);
                })
                .catch((err) => console.error('Error fetching folders:', err));

            // 2. Fetch folderless lists
            fetch(`https://api.clickup.com/api/v2/space/${spaceId}/list?archived=false`, {
                headers: { Authorization: settings.apiToken || '' },
            })
                .then((res) => res.json())
                .then((data) => {
                    setLists(data.lists || []);
                })
                .catch((err) => console.error('Error fetching lists:', err));
        },
        [settings.apiToken, setSettings]
    );

    /**
     * If there's already a selected space, fetch folders/lists for it
     */
    useEffect(() => {
        if (spaces.length > 0 && settings.selectedSpace) {
            handleSelectSpace(settings.selectedSpace);
        }
    }, [spaces, settings.selectedSpace, handleSelectSpace]);

    /**
     * Handle user selecting a Folder
     */
    const handleSelectFolder = useCallback(
        (folderId: string) => {
            setSettings((prev) => ({
                ...prev,
                selectedFolder: folderId,
                selectedList: '', // reset list if folder changes
            }));

            if (!folderId) {
                setLists([]);
                return;
            }

            fetch(`https://api.clickup.com/api/v2/folder/${folderId}/list`, {
                headers: { Authorization: settings.apiToken || '' },
            })
                .then((res) => res.json())
                .then((data) => {
                    setLists(data.lists || []);
                })
                .catch((err) => console.error('Error fetching folder-lists:', err));
        },
        [settings.apiToken, setSettings]
    );

    /**
     * If there's a saved selectedFolder, fetch lists for it
     */
    useEffect(() => {
        if (folders.length > 0 && settings.selectedFolder) {
            handleSelectFolder(settings.selectedFolder);
        }
    }, [folders, settings.selectedFolder, handleSelectFolder]);

    /**
     * Handle user selecting a List (and fetch custom fields)
     */
    const handleSelectList = useCallback(
        (listId: string) => {
            setSettings((prev) => ({
                ...prev,
                selectedList: listId,
            }));

            if (!listId) return;

            // Fetch custom fields for the chosen list
            fetch(`https://api.clickup.com/api/v2/list/${listId}/field`, {
                headers: { Authorization: settings.apiToken || '' },
            })
                .then((res) => res.json())
                .then((data) => {
                    console.log('List fields:', data.fields);
                    const newAvailableFields = data.fields?.map(
                        (field: {
                            id: string;
                            name: string;
                            type: string;
                            type_config?: { options?: { id: string; name: string }[] };
                        }) => ({
                            id: field.id,
                            name: field.name,
                            type: field.type,
                            options: field.type === 'drop_down' ? field.type_config?.options : undefined,
                        })
                    ) || [];

                    // Update fields in parent
                    updateFields(selectedFieldIds, newAvailableFields);
                })
                .catch((err) => console.error('Error fetching custom fields:', err));
        },
        [settings.apiToken, selectedFieldIds, setSettings, updateFields]
    );

    /**
     * If there's already a selectedList, load custom fields just once
     */
    useEffect(() => {
        if (!settings.selectedList) return;
        if (!hasLoadedCustomFields.current) {
            handleSelectList(settings.selectedList);
            hasLoadedCustomFields.current = true;
        }
    }, [settings.selectedList, handleSelectList]);

    // Render the dropdowns
    return (
        <div>
            {/* Teams */}
            < select
                value={settings.selectedTeam || ''}
                onChange={(e) => handleSelectTeam(e.target.value)
                }
                className="w-full p-2 border rounded mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="" > Select a Workspace...</option>
                {
                    teams.map((team) => (
                        <option key={team.id} value={team.id} >
                            {team.name}
                        </option>
                    ))
                }
            </select>

            {/* Spaces */}
            <select
                value={settings.selectedSpace || ''}
                onChange={(e) => handleSelectSpace(e.target.value)}
                className="w-full p-2 border rounded mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="" > Select a Space...</option>
                {
                    spaces.map((space) => (
                        <option key={space.id} value={space.id} >
                            {space.name}
                        </option>
                    ))
                }
            </select>

            {/* Folders */}
            <select
                value={settings.selectedFolder || ''}
                onChange={(e) => handleSelectFolder(e.target.value)}
                className="w-full p-2 border rounded mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="" > (No Folder)</option>
                {
                    folders.map((folder) => (
                        <option key={folder.id} value={folder.id} >
                            {folder.name}
                        </option>
                    ))
                }
            </select>

            {/* Lists */}
            <select
                value={settings.selectedList || ''}
                onChange={(e) => handleSelectList(e.target.value)}
                className="w-full p-2 border rounded mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="" > Select a List...</option>
                {
                    lists.map((list) => (
                        <option key={list.id} value={list.id} >
                            {list.name}
                        </option>
                    ))
                }
            </select>
        </div>
    );
}