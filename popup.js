document.getElementById("createTaskButton").addEventListener("click", () => {
    const status = document.getElementById("status");
    const name = document.getElementById("nameField").value;
    const email = document.getElementById("emailField").value;

    if (!name || !email) {
        status.textContent = "Both Name and Email are required.";
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
                taskUrl: currentUrl, // Include the current URL
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