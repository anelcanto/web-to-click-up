chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "createTask") {
        const taskName = message.taskName;
        const taskEmail = message.taskEmail;
        const taskUrl = message.taskUrl; // URL from the popup

        // Retrieve API token and list ID from Chrome storage
        chrome.storage.sync.get(['apiToken', 'listId'], function (items) {
            const apiToken = items.apiToken;
            const listId = items.listId;

            // Check if API token or list ID is missing
            if (!apiToken || !listId) {
                sendResponse({ success: false, error: 'API token or List ID not set.' });
                return;
            }

            // Construct the payload
            const taskPayload = {
                name: taskName,
                custom_fields: [
                    {
                        id: "575825bb-27c6-4f36-91f3-7d3f6f665c42", // Custom field ID for Email
                        value: taskEmail
                    },
                    {
                        id: "f574a621-12f3-46e0-a039-65708aff14eb", // Custom field ID for Dice profile
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