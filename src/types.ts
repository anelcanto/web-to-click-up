// src/types.ts
export interface LocationItem {
    id: string;
    name?: string;
}

export interface Settings {
    apiToken?: string;
    selectedTeam?: string;
    selectedSpace?: string;
    selectedFolder?: string | null;
    selectedList?: string;
    fieldMappings?: Record<string, string>;
}