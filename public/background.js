chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "createTask") {
        const taskName = message.taskName;
        const taskEmail = message.taskEmail;
        // const taskUrl = message.taskUrl; // commented out

        chrome.storage.sync.get(
            ['apiToken', 'selectedList', 'fieldMappings'],
            function (items) {
                const taskPayload = {
                    name: taskName,
                    custom_fields: [],
                };

                if (items.fieldMappings && typeof items.fieldMappings === 'object') {
                    const emailFieldId = items.fieldMappings["Email Field"];
                    // const urlFieldId = items.fieldMappings["URL Field"];

                    if (emailFieldId) {
                        taskPayload.custom_fields.push({
                            id: emailFieldId,
                            value: taskEmail,
                        });
                    }

                    // if (urlFieldId) {
                    //   taskPayload.custom_fields.push({
                    //     id: urlFieldId,
                    //     value: taskUrl,
                    //   });
                    // }
                }

                // POST to ClickUp ...
            }
        );

        return true;
    }
});

chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
