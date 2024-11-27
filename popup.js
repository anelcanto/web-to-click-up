document.getElementById("createTaskButton").addEventListener("click", () => {
    const status = document.getElementById("status");
    const name = document.getElementById("nameField").value;
    const email = document.getElementById("emailField").value;

    if (!name || !email) {
        status.textContent = "Both Name and Email are required.";
        return;
    }

    status.textContent = "Creating task...";

    // Send message to the background script
    chrome.runtime.sendMessage(
        { action: "createTask", taskName: name, taskEmail: email },
        (response) => {
            if (response.success) {
                status.textContent = "Task created successfully!";
            } else {
                status.textContent = `Error: ${response.error}`;
            }
        }
    );
});