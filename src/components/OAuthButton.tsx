import React, { useState } from "react";
import { Settings } from "../types";

interface SettingsProp {
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

export default function OAuthButton({ settings, setSettings }: SettingsProp) {
    const [isLoading, setIsLoading] = useState(false);

    const handleConnectClickup = () => {
        setIsLoading(true);
        chrome.runtime.sendMessage({ action: "startOAuth" }, (response) => {
            if (response && response.success) {
                console.log("OAuth successful! Access token:", response.accessToken);
                // Save the token in your extension state
                setSettings((prev) => ({ ...prev, apiToken: response.accessToken }));
            } else {
                console.error("OAuth failed:", response ? response.error : "No response");
            }
            setIsLoading(false);
        });
    };

    const handleSignOut = () => {
        // Remove the token from your extension state
        setSettings((prev) => ({ ...prev, apiToken: "" }));
    };

    // Show a loading animation if loading; otherwise show connect/sign-out based on apiToken
    if (isLoading) {
        return (
            <div className="flex items-center justify-center mb-2">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="flex items-center space-x-2 mb-2">
            {settings.apiToken ? (
                // Render a sign out button if token exists
                <button
                    onClick={handleSignOut}
                    className="w-full p-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                    Sign Out of ClickUp
                </button>
            ) : (
                // Else, render the connect button.
                <button
                    onClick={handleConnectClickup}
                    className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    Connect ClickUp
                </button>
            )}
        </div>
    );
}