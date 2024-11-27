// Save settings when the button is clicked
document.getElementById('saveSettingsButton').addEventListener('click', function () {
    const apiToken = document.getElementById('apiToken').value;
    const listId = document.getElementById('listId').value;

    chrome.storage.sync.set({ apiToken, listId }, function () {
        const status = document.getElementById('status');
        status.textContent = 'Settings saved.';
        setTimeout(() => { status.textContent = ''; }, 1500);
    });
});

// Restore settings on page load
document.addEventListener('DOMContentLoaded', function () {
    chrome.storage.sync.get(['apiToken', 'listId'], function (items) {
        if (items.apiToken) document.getElementById('apiToken').value = items.apiToken;
        if (items.listId) document.getElementById('listId').value = items.listId;
    });
});

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