// public/background.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "createTask") {
        const taskData = message.payload;

        chrome.storage.local.get(['apiToken', 'selectedList', 'teamId', 'fieldMappings'], function (items) {
            const { apiToken, selectedList, teamId, fieldMappings } = items;

            if (!apiToken || !selectedList) {
                sendResponse({ success: false, error: 'Missing API token or selected list.' });
                return;
            }

            // Build the URL, including query parameters if required.
            // Example: if you want to reference a task by its custom task ID, you might add ?custom_task_ids=true&team_id={teamId}
            const queryParams = new URLSearchParams();
            // Uncomment these lines if using custom task ids
            // queryParams.append('custom_task_ids', 'true');
            // if (teamId) queryParams.append('team_id', teamId);
            const url = `https://api.clickup.com/api/v2/list/${selectedList}/task${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

            // Build the payload for the API using both standard and custom fields.
            // Standard fields mapping (required or optional):
            const payload = {
                name: taskData.name,                        // Required
                // If provided, you can set markdown_content to override description.
                // markdown_content: taskData.markdown_content, 
                description: taskData.description || "",     // Use description if markdown_content is not provided.
                assignees: taskData.assignees || [],         // Array of integers (user IDs)
                status: taskData.status || "",               // String
                priority: taskData.priority || null,         // Integer or null
                due_date: taskData.due_date || null,         // Unix timestamp in milliseconds
                due_date_time: taskData.due_date_time || false,// Boolean - whether due_date includes time
                start_date: taskData.start_date || null,     // Unix timestamp
                start_date_time: taskData.start_date_time || false,
                time_estimate: taskData.time_estimate || null, // Integer (in milliseconds or seconds as required)
                points: taskData.points || null,             // Number
                notify_all: taskData.notify_all || false,    // Boolean
                parent: taskData.parent || null,             // Parent task id if creating a subtask
                links_to: taskData.links_to || null,         // Linked dependency task id
                check_required_custom_fields: taskData.check_required_custom_fields || false,
                // Add additional standard properties as needed,
                // Example: archived, group_assignees, tags, etc.
            };

            // Build custom fields payload. The ClickUp API expects an array of objects.
            // Each object should include at least id and a nested object with the key "value" and optionally other keys (e.g., value_options).
            const customFields = [];
            if (Array.isArray(taskData.custom_fields)) {
                taskData.custom_fields.forEach(cf => {
                    // If you have a mapping for the field id, use it; otherwise use the original.
                    const mappedId = (fieldMappings && fieldMappings[cf.id]) ? fieldMappings[cf.id] : cf.id;

                    // Each custom field must be an object with the key "value".
                    // Optionally include "value_options" (for date fields, for example).
                    customFields.push({
                        id: mappedId,
                        value: cf.value,
                        ...(cf.value_options ? { value_options: cf.value_options } : {}),
                    });
                });
            }

            // Only add custom_fields if available.
            if (customFields.length) {
                payload.custom_fields = customFields;
            }

            // Optionally log the payload for debugging.
            console.log("Payload being sent:", payload);

            // Make the POST request to create the task.
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': apiToken,  // API token provided in Chrome Storage
                },
                body: JSON.stringify(payload),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.id) { // Assuming a successful response includes a task id
                        sendResponse({ success: true, task: data });
                    } else {
                        sendResponse({ success: false, error: data });
                    }
                })
                .catch(error => {
                    console.error('Error creating task:', error);
                    sendResponse({ success: false, error: error.message });
                });
        });

        // Return true to indicate asynchronous response.
        return true;
    }
});

chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));