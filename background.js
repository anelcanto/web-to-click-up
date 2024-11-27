chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "createTask") {
        const taskName = message.taskName;
        const taskEmail = message.taskEmail;
        const taskUrl = message.taskUrl; // URL from the popup

        // Retrieve API token, list ID, and custom field IDs from Chrome storage
        chrome.storage.sync.get(['apiToken', 'listId', 'customFieldIdEmail', 'customFieldIdUrl'], function (items) {
            const apiToken = items.apiToken;
            const listId = items.listId;
            const customFieldIdEmail = items.customFieldIdEmail;
            const customFieldIdUrl = items.customFieldIdUrl;

            // Check if any required settings are missing
            if (!apiToken || !listId || !customFieldIdEmail || !customFieldIdUrl) {
                sendResponse({ success: false, error: 'API token, List ID, or Custom Field IDs not set.' });
                return;
            }

            // Construct the payload
            const taskPayload = {
                name: taskName,
                custom_fields: [
                    {
                        id: customFieldIdEmail, // Use the custom field ID from settings
                        value: taskEmail
                    },
                    {
                        id: customFieldIdUrl, // Use the custom field ID from settings
                        value: taskUrl
                    }
                ]
            };

            // Make the fetch request using the retrieved API token and list ID
            fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
                method: "POST",
                headers: {
                    "Authorization": apiToken,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(taskPayload)
            })
                .then(response => response.json())
                .then(data => {
                    sendResponse({ success: true, data });
                })
                .catch(error => {
                    console.error("Error creating ClickUp task:", error);
                    sendResponse({ success: false, error: error.message });
                });
        });

        return true; // Keep the message channel open for async response
    }
});