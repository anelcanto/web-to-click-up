import React, { useState } from 'react'

interface CreateTaskProps {
    onGoToSettings: () => void
}

export default function CreateTask({ onGoToSettings }: CreateTaskProps) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [statusMsg, setStatusMsg] = useState('')

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
                onClick={onGoToSettings}
                className="w-full p-2 text-blue-700 underline hover:text-blue-900"
            >
                Settings
            </button>
        </div>
    )
}