// Existing code for creating a task
document.getElementById("taskForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const status = document.getElementById("status");
    const name = document.getElementById("nameField").value;
    const email = document.getElementById("emailField").value;

    if (!name || !email) {
        status.textContent = "Both Name and Email are required.";
        return;
    }

    // Check if custom field IDs are set
    chrome.storage.sync.get(['customFieldIdEmail', 'customFieldIdUrl'], function (items) {
        if (!items.customFieldIdEmail || !items.customFieldIdUrl) {
            status.textContent = "Custom Field IDs are not set in settings.";
            return;
        }

        status.textContent = "Creating task...";

        // Get the current tab's URL
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentUrl = tabs[0]?.url || "No URL available";

            // Send message to the background script
            chrome.runtime.sendMessage(
                {
                    action: "createTask",
                    taskName: name,
                    taskEmail: email,
                    taskUrl: currentUrl,
                },
                (response) => {
                    if (response.success) {
                        status.textContent = "Task created successfully!";
                    } else {
                        status.textContent = `Error: ${response.error}`;
                    }
                }
            );
        });
    });
});

// Toggle between Create Task view and Settings view
document.getElementById("openSettings").addEventListener("click", () => {
    document.getElementById("createTaskView").style.display = "none";
    document.getElementById("settingsView").style.display = "block";
    loadSettings(); // Load existing settings when opening the settings view
});

document.getElementById("backToTask").addEventListener("click", () => {
    document.getElementById("settingsView").style.display = "none";
    document.getElementById("createTaskView").style.display = "block";
});

// Save settings when the button is clicked
document.getElementById('saveSettingsButton').addEventListener('click', function () {
    const apiToken = document.getElementById('apiToken').value;
    const listId = document.getElementById('listId').value;
    const customFieldIdEmail = document.getElementById('customFieldIdEmail').value;
    const customFieldIdUrl = document.getElementById('customFieldIdUrl').value;

    chrome.storage.sync.set({ apiToken, listId, customFieldIdEmail, customFieldIdUrl }, function () {
        const status = document.getElementById('settingsStatus');
        status.textContent = 'Settings saved.';
        setTimeout(() => { status.textContent = ''; }, 1500);
    });
});

// Load settings when opening the settings view
function loadSettings() {
    chrome.storage.sync.get(['apiToken', 'listId', 'customFieldIdEmail', 'customFieldIdUrl'], function (items) {
        if (items.apiToken) document.getElementById('apiToken').value = items.apiToken;
        if (items.listId) document.getElementById('listId').value = items.listId;
        if (items.customFieldIdEmail) document.getElementById('customFieldIdEmail').value = items.customFieldIdEmail;
        if (items.customFieldIdUrl) document.getElementById('customFieldIdUrl').value = items.customFieldIdUrl;
    });
}

// Toggle visibility of the API token
document.getElementById('toggleApiTokenVisibility').addEventListener('click', function () {
    const apiTokenField = document.getElementById('apiToken');
    const toggleButton = document.getElementById('toggleApiTokenVisibility');

    if (apiTokenField.type === 'password') {
        apiTokenField.type = 'text';
        toggleButton.textContent = 'Hide';
    } else {
        apiTokenField.type = 'password';
        toggleButton.textContent = 'Show';
    }
});