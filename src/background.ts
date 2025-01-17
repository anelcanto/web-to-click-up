import { CLIENT_SECRET } from "./config";

// Listen for messages to create tasks or initiate OAuth
interface FieldOption {
    id: string;
    name: string;
}
interface CustomField {
    id: string; // Unique identifier of the custom field
    name: string; // Name of the custom field
    type: string; // Type of the custom field (e.g., "text", "number", etc.)
    type_config: Record<string, unknown>;
    date_created: string; // Creation timestamp as a string
    hide_from_guests: boolean; // Whether the field is hidden from guest users
    value?: string; // Optional: The value assigned to the custom field on a task
    value_options?: FieldOption[]; // Optional: Options for dropdown/multi-select fields
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "createTask") {
        const taskData = message.payload;

        chrome.storage.local.get(['apiToken', 'selectedList', 'selectedTeam', 'fieldMappings'], function (items) {
            // const { apiToken, selectedList, selectedTeam, fieldMappings } = items;
            const { apiToken, selectedList, fieldMappings } = items;

            if (!apiToken || !selectedList) {
                sendResponse({ success: false, error: 'Missing API token or selected list.' });
                return;
            }

            // Build the URL, including query parameters if required.
            const queryParams = new URLSearchParams();
            // Uncomment these lines if using custom task ids
            // queryParams.append('custom_task_ids', 'true');
            // if (selectedTeam) queryParams.append('team_id', selectedTeam);
            const url = `https://api.clickup.com/api/v2/list/${selectedList}/task${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

            // Build custom fields payload
            const customFields: CustomField[] = [];
            if (Array.isArray(taskData.custom_fields)) {
                taskData.custom_fields.forEach((cf: CustomField) => {
                    const mappedId = (fieldMappings && fieldMappings[cf.id]) ? fieldMappings[cf.id] : cf.id;
                    customFields.push({
                        id: mappedId,
                        name: cf.name || "",
                        type: cf.type || "text",
                        type_config: cf.type_config || {},
                        date_created: cf.date_created || new Date().toISOString(),
                        hide_from_guests: cf.hide_from_guests || false,
                        value: cf.value || "",
                        ...(cf.value_options ? { value_options: cf.value_options } : {}),
                    });
                });
            }

            const payload = {
                name: taskData.name,
                description: taskData.description || "",
                check_required_custom_fields: taskData.check_required_custom_fields || false,
                ...(customFields.length > 0 && { custom_fields: customFields }),
            };

            console.log("Payload being sent:", payload);

            // Make the API call with the updated payload
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': apiToken,
                },
                body: JSON.stringify(payload),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.id) {
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

    if (message.action === "startOAuth") {
        const clientId = "KHYFIN9VSU8TBIRSA10WOGT5BPSQI0TO";
        const redirectUri = chrome.identity.getRedirectURL();
        const clientSecret = CLIENT_SECRET;
        console.log("Redirect URI:", redirectUri);
        const state = Math.random().toString(36).substring(7); // Generate a random state value for CSRF protection

        const authUrl = `https://app.clickup.com/api?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
        // const authUrl = `https://app.clickup.com/api?client_id=${clientId}&redirect_uri=${redirectUri}`;

        chrome.identity.launchWebAuthFlow(
            {
                url: authUrl,
                interactive: true, // Opens a popup to let the user log in
            },
            (redirectUrl) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    sendResponse({ success: false, error: chrome.runtime.lastError.message });
                    return;
                }

                if (!redirectUrl) {
                    sendResponse({ success: false, error: "No redirect URL received." });
                    return;
                }

                // Parse the authorization code from the redirect URL
                const urlParams = new URLSearchParams(new URL(redirectUrl).search);
                const code = urlParams.get("code");

                console.log('urlParams', urlParams);
                console.log('code', code);

                if (!code) {
                    console.log("data", urlParams, code, redirectUrl, authUrl);
                    sendResponse({ success: false, error: "Authorization code not found." });
                    return;
                }

                // Exchange the authorization code for an access token
                fetch("https://api.clickup.com/api/v2/oauth/token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        client_id: clientId,
                        client_secret: clientSecret,
                        code: code,
                    }),
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.access_token) {
                            // Save the access token in Chrome storage
                            chrome.storage.local.set({ apiToken: data.access_token }, () => {
                                console.log("Access token saved:", data.access_token);
                            });
                            sendResponse({ success: true, accessToken: data.access_token });
                        } else {
                            sendResponse({ success: false, error: data.error });
                        }
                    })
                    .catch((error) => {
                        console.error("Token exchange error:", error);
                        sendResponse({ success: false, error: error.message });
                    });
            }
        );

        // Indicate that the response will be sent asynchronously
        return true;
    }
});

// Set the side panel behavior to open on action click
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));