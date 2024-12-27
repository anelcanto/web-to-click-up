import React, { useEffect, useState } from 'react'

type Settings = {
    apiToken?: string
    listId?: string
    customFieldIdEmail?: string
    customFieldIdUrl?: string
}

export default function SidePanel() {
    const [view, setView] = useState<'createTask' | 'settings'>('createTask')

    // Create Task fields
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [statusMsg, setStatusMsg] = useState('')

    // Settings fields
    const [settings, setSettings] = useState<Settings>({})
    const [apiTokenVisible, setApiTokenVisible] = useState(false)
    const [settingsStatus, setSettingsStatus] = useState('')

    useEffect(() => {
        if (view === 'settings') {
            loadSettings()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view])

    // ----- Handlers for the "Create Task" form -----
    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault()

        if (!name || !email) {
            setStatusMsg('Both Name and Email are required.')
            return
        }

        // Check if custom field IDs are set
        window.chrome?.storage?.sync.get(
            ['customFieldIdEmail', 'customFieldIdUrl'],
            (items: any) => {
                if (!items.customFieldIdEmail || !items.customFieldIdUrl) {
                    setStatusMsg('Custom Field IDs are not set in settings.')
                    return
                }

                setStatusMsg('Creating task...')

                // Get the current tab's URL
                window.chrome?.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
                    const currentUrl = tabs[0]?.url || 'No URL available'

                    // Send message to background
                    window.chrome?.runtime.sendMessage(
                        {
                            action: 'createTask',
                            taskName: name,
                            taskEmail: email,
                            taskUrl: currentUrl,
                        },
                        (response: any) => {
                            if (response?.success) {
                                setStatusMsg('Task created successfully!')
                                setName('')
                                setEmail('')
                            } else {
                                setStatusMsg(`Error: ${response?.error || 'Unknown error'}`)
                            }
                        }
                    )
                })
            }
        )
    }

    // ----- Handlers for the "Settings" view -----
    const loadSettings = () => {
        window.chrome?.storage?.sync.get(
            ['apiToken', 'listId', 'customFieldIdEmail', 'customFieldIdUrl'],
            (items: any) => {
                setSettings({
                    apiToken: items.apiToken || '',
                    listId: items.listId || '',
                    customFieldIdEmail: items.customFieldIdEmail || '',
                    customFieldIdUrl: items.customFieldIdUrl || '',
                })
            }
        )
    }

    const saveSettings = () => {
        window.chrome?.storage?.sync.set(
            {
                apiToken: settings.apiToken,
                listId: settings.listId,
                customFieldIdEmail: settings.customFieldIdEmail,
                customFieldIdUrl: settings.customFieldIdUrl,
            },
            () => {
                setSettingsStatus('Settings saved.')
                setTimeout(() => setSettingsStatus(''), 1500)
            }
        )
    }

    const toggleApiTokenVisibility = () => {
        setApiTokenVisible((prev) => !prev)
    }

    // ----- Render the side panel -----
    if (view === 'settings') {
        // Settings view
        return (
            <div className="p-4 w-72 font-sans">
                <h3 className="text-lg font-bold mb-4">Settings</h3>

                {/* API Token */}
                <div className="mb-4">
                    <label htmlFor="apiToken" className="block mb-1 font-medium">
                        API Token:
                    </label>
                    <div className="flex items-center space-x-2">
                        <input
                            id="apiToken"
                            type={apiTokenVisible ? 'text' : 'password'}
                            placeholder="Enter your API token"
                            value={settings.apiToken ?? ''}
                            onChange={(e) =>
                                setSettings((prev) => ({ ...prev, apiToken: e.target.value }))
                            }
                            className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={toggleApiTokenVisibility}
                            className="p-2 bg-gray-200 rounded hover:bg-gray-300"
                            aria-label="Toggle API Token Visibility"
                        >
                            {apiTokenVisible ? 'Hide' : 'Show'}
                        </button>
                    </div>
                </div>

                {/* List ID */}
                <div className="mb-4">
                    <label htmlFor="listId" className="block mb-1 font-medium">
                        List ID:
                    </label>
                    <input
                        id="listId"
                        placeholder="Enter your List ID"
                        value={settings.listId ?? ''}
                        onChange={(e) =>
                            setSettings((prev) => ({ ...prev, listId: e.target.value }))
                        }
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Custom Field ID Email */}
                <div className="mb-4">
                    <label htmlFor="customFieldIdEmail" className="block mb-1 font-medium">
                        Custom Field ID for Email:
                    </label>
                    <input
                        id="customFieldIdEmail"
                        placeholder="Enter Custom Field ID for Email"
                        value={settings.customFieldIdEmail ?? ''}
                        onChange={(e) =>
                            setSettings((prev) => ({
                                ...prev,
                                customFieldIdEmail: e.target.value,
                            }))
                        }
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Custom Field ID Url */}
                <div className="mb-4">
                    <label htmlFor="customFieldIdUrl" className="block mb-1 font-medium">
                        Custom Field ID for Dice Profile:
                    </label>
                    <input
                        id="customFieldIdUrl"
                        placeholder="Enter Custom Field ID for Dice Profile"
                        value={settings.customFieldIdUrl ?? ''}
                        onChange={(e) =>
                            setSettings((prev) => ({
                                ...prev,
                                customFieldIdUrl: e.target.value,
                            }))
                        }
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Save Settings */}
                <button
                    onClick={saveSettings}
                    className="w-full mb-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    Save Settings
                </button>
                <p className="text-sm text-gray-700">{settingsStatus}</p>

                <hr className="my-4" />

                <button
                    onClick={() => setView('createTask')}
                    className="w-full p-2 text-blue-700 underline hover:text-blue-900"
                >
                    Back to Create Task
                </button>
            </div>
        )
    }

    // Create Task view
    return (
        <div className="p-4 w-72 font-sans">
            <h3 className="text-lg font-bold mb-4">Create Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-3 mb-4">
                <input
                    type="text"
                    placeholder="Enter Name"
                    aria-label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="email"
                    placeholder="Email"
                    aria-label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    Create Task
                </button>
            </form>
            <p className="text-sm text-red-600">{statusMsg}</p>

            <hr className="my-4" />

            <button
                onClick={() => setView('settings')}
                className="w-full p-2 text-blue-700 underline hover:text-blue-900"
            >
                Settings
            </button>
        </div>
    )
}