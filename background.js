chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "createTask") {
        const taskName = message.taskName;

        fetch(`https://api.clickup.com/api/v2/list/901106736806/task`, {
            method: "POST",
            headers: {
                "Authorization": "pk_75433828_KGH044Z9LN53YEFO3U0FUO2NSHVY08FG",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: taskName
            })
        })
            .then(response => response.json())
            .then(data => {
                sendResponse({ success: true, data });
            })
            .catch(error => {
                console.error("Error creating ClickUp task:", error);
                sendResponse({ success: false, error: error.message });
            });

        return true; // Keep the message channel open for async response
    }
});
