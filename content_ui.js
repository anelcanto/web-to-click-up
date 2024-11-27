// Check if the UI already exists
if (document.querySelector('#clickup-extension-ui')) {
    document.querySelector('#clickup-extension-ui').remove();
} else {
    const container = document.createElement('div');
    container.id = 'clickup-extension-ui';
    container.style.position = 'fixed';
    container.style.top = '10px';
    container.style.right = '10px';
    container.style.width = '300px';
    container.style.height = '400px';
    container.style.background = 'white';
    container.style.border = '1px solid #ccc';
    container.style.zIndex = '10000';
    container.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
    container.style.padding = '10px';
    container.style.overflowY = 'auto';

    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('popup.html');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.title = 'ClickUp Extension UI';

    container.appendChild(iframe);
    document.body.appendChild(container);
}