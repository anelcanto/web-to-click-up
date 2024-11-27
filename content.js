// content.js

// Function to validate email format
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Function to extract candidate data
function getCandidateData() {
    const candidateName = document.querySelector('#profile-page-info-name')?.innerText.trim() || '';
    const phoneNumber = document.querySelector('div[aria-label^="Phone Number"]')?.innerText.trim() || '';
    const linkedInURL = document.querySelector('a[href*="linkedin.com"]')?.href || '';
    const email = document.querySelector('a[href^="mailto:"]')?.href.replace('mailto:', '') || '';

    // Log warnings if critical elements are missing
    if (!candidateName) console.warn('Candidate name element not found.');
    if (!phoneNumber) console.warn('Phone number element not found.');
    if (!linkedInURL) console.warn('LinkedIn URL element not found.');
    if (!email) console.warn('Email element not found.');

    return {
        candidateName,
        phoneNumber,
        linkedInURL,
        email: isValidEmail(email) ? email : ''
    };
}

// Send the extracted data to the background script
chrome.runtime.sendMessage({ action: 'storeCandidateData', data: getCandidateData() }, (response) => {
    if (chrome.runtime.lastError) {
        console.error('Error sending message to background script:', chrome.runtime.lastError.message);
    } else {
        console.log('Candidate data sent successfully:', response);
    }
});