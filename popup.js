document.getElementById("createTaskButton").addEventListener("click", async () => {
    const status = document.getElementById("status");
    status.textContent = "Reading clipboard...";

    try {
        // Read text from the clipboard
        const clipboardText = await navigator.clipboard.readText();
        if (!clipboardText) {
            status.textContent = "Clipboard is empty.";
            return;
        }

        status.textContent = "Creating task...";

        // Send message to the background script
        chrome.runtime.sendMessage(
            { action: "createTask", taskName: clipboardText },
            (response) => {
                if (response.success) {
                    status.textContent = "Task created successfully!";
                } else {
                    status.textContent = `Error: ${response.error}`;
                }
            }
        );
    } catch (err) {
        console.error("Clipboard read error:", err);
        status.textContent = `Error: ${err.message}`;
    }
});

document.getElementById('openSettings').addEventListener('click', function () {
    if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    } else {
        window.open(chrome.runtime.getURL('options.html'));
    }
});