// src/assets/sidepanel/SidePanel.tsx
import React from 'react';
import CreateTask from './CreateTask';
import SettingsPanel from './SettingsPanel';

export default function SidePanel() {
    const [isSettings, setIsSettings] = React.useState(false);

    return (
        <div>
            {isSettings ? (
                <SettingsPanel onGoToCreateTask={() => setIsSettings(false)} />
            ) : (
                <CreateTask onGoToSettings={() => setIsSettings(true)} />
            )}
        </div>
    );
}