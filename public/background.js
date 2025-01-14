// src/assets/sidepanel/background.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "createTask") {
        const taskData = message.payload;

        chrome.storage.local.get(
            ['apiToken', 'selecteddList', 'fieldMappings'],
            function (items) {
                const { apiToken, selectedList, fieldMappings } = items;

                if (!apiToken || !selectedList) {
                    sendResponse({ success: false, error: 'Missing API token or selected list.' });
                    return;
                }

                const taskPayload = {
                    name: taskData.name,
                    custom_fields: [],
                };

                if (fieldMappings && typeof fieldMappings === 'object') {
                    taskData.custom_fields.forEach(cf => {
                        if (fieldMappings[cf.id]) {
                            taskPayload.custom_fields.push({
                                id: fieldMappings[cf.id],
                                value: cf.value,
                            });
                        }
                    });
                }

                fetch(`https://api.clickup.com/api/v2/list/${selectedList}/task`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': apiToken,
                    },
                    body: JSON.stringify(taskPayload),
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.id) { // Assuming successful response includes task id
                            sendResponse({ success: true, task: data });
                        } else {
                            sendResponse({ success: false, error: data });
                        }
                    })
                    .catch(error => {
                        console.error('Error creating task:', error);
                        sendResponse({ success: false, error: error.message });
                    });
            }
        );

        return true; // Keep the message channel open for sendResponse
    }
});

chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));