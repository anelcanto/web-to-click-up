// import React from 'react'
import { useState } from 'react'
import CreateTask from './CreateTask'
import SettingsPanel from './SettingsPanel'

export default function SidePanel() {
    const [view, setView] = useState<'createTask' | 'settings'>('createTask')

    // Simple callbacks to toggle the view
    const goToSettings = () => setView('settings')
    const goToCreateTask = () => setView('createTask')

    return (
        <>
            {view === 'createTask' ? (
                <CreateTask onGoToSettings={goToSettings} />
            ) : (
                <SettingsPanel onGoToCreateTask={goToCreateTask} />
            )}
        </>
    )
}