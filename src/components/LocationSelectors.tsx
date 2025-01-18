// src/components/LocationSelectors.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Field } from './RenderField';

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

// These settings should match the values you expect from your SettingsPanel
interface Settings {
    apiToken?: string;
    selectedTeam?: string;
    selectedSpace?: string;
    selectedFolder?: string | null;
    selectedList?: string;
    fieldMappings?: Record<string, string>;
}

interface LocationSelectorsProps {
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
    selectedFieldIds: string[];
    updateFields: (selectedFieldIds: string[], availableFields: Field[]) => void;
}

export default function LocationSelectors({
    settings,
    setSettings,
    selectedFieldIds,
    updateFields,
}: LocationSelectorsProps) {
    const [teams, setTeams] = useState<Team[]>([]);
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [lists, setLists] = useState<List[]>([]);

    const hasLoadedCustomFields = useRef(false);

    // -------------------------------
    // Existing useEffects for fetching data
    // -------------------------------

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

    const handleSelectTeam = useCallback(
        (teamId: string) => {
            setSettings((prev) => ({
                ...prev,
                selectedTeam: teamId,
            }));

            if (!teamId) {
                setSpaces([]);
                return;
            }

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

    useEffect(() => {
        if (teams.length > 0 && settings.selectedTeam) {
            handleSelectTeam(settings.selectedTeam);
        }
    }, [teams, settings.selectedTeam, handleSelectTeam]);

    const handleSelectSpace = useCallback(
        (spaceId: string) => {
            setSettings((prev) => ({
                ...prev,
                selectedSpace: spaceId,
            }));

            if (!spaceId) {
                setFolders([]);
                setLists([]);
                return;
            }

            fetch(`https://api.clickup.com/api/v2/space/${spaceId}/folder?archived=false`, {
                headers: { Authorization: settings.apiToken || '' },
            })
                .then((res) => res.json())
                .then((data) => {
                    setFolders(data.folders || []);
                })
                .catch((err) => console.error('Error fetching folders:', err));

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

    useEffect(() => {
        if (spaces.length > 0 && settings.selectedSpace) {
            handleSelectSpace(settings.selectedSpace);
        }
    }, [spaces, settings.selectedSpace, handleSelectSpace]);

    const handleSelectFolder = useCallback(
        (folderId: string) => {
            setSettings((prev) => ({
                ...prev,
                selectedFolder: folderId,
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

    useEffect(() => {
        if (folders.length > 0 && settings.selectedFolder) {
            handleSelectFolder(settings.selectedFolder);
        }
    }, [folders, settings.selectedFolder, handleSelectFolder]);

    const handleSelectList = useCallback(
        (listId: string) => {
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
                            options:
                                field.type === 'drop_down'
                                    ? field.type_config?.options
                                    : undefined,
                        })
                    ) || [];

                    updateFields(selectedFieldIds, newAvailableFields);
                })
                .catch((err) => console.error('Error fetching custom fields:', err));
        },
        [settings.apiToken, selectedFieldIds, setSettings, updateFields]
    );

    useEffect(() => {
        console.log('[LocationSelectors] useEffect loading');
        if (!settings.selectedList) return;
        if (!hasLoadedCustomFields.current) {
            handleSelectList(settings.selectedList);
            hasLoadedCustomFields.current = true;
        }
    }, [settings.selectedList, handleSelectList]);

    // ---------------------------------------
    // New useEffect: Reset UI when location settings are cleared
    // ---------------------------------------
    useEffect(() => {
        // When any of the key location settings are undefined, reset the local state.
        if (
            settings.selectedTeam === undefined &&
            settings.selectedSpace === undefined &&
            settings.selectedFolder === undefined &&
            settings.selectedList === undefined
        ) {
            // Clear out all the local states for teams, spaces, folders, and lists.
            setTeams([]);
            setSpaces([]);
            setFolders([]);
            setLists([]);
            // Reset the ref for custom fields loading if necessary.
            hasLoadedCustomFields.current = false;
        }
    }, [
        settings.selectedTeam,
        settings.selectedSpace,
        settings.selectedFolder,
        settings.selectedList,
    ]);

    // ---------------------------------------
    // Render the selectors
    // ---------------------------------------
    return (
        <div>
            {/* Teams */}
            <select
                value={settings.selectedTeam || ''}
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

            {/* Spaces */}
            <select
                value={settings.selectedSpace || ''}
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
                value={settings.selectedList || ''}
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
        </div>
    );
}