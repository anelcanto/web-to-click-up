// src/components/OAuthButton.tsx
import React, { useState } from "react";
import { Settings } from "../types";

interface OAuthButtonProps {
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
    clearSelectedFields: () => void; // New prop to clear selected fields
}

export default function OAuthButton({ settings, setSettings, clearSelectedFields }: OAuthButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleConnectClickup = () => {
        setIsLoading(true);
        chrome.runtime.sendMessage({ action: "startOAuth" }, (response) => {
            if (response && response.success) {
                console.log("OAuth successful! Access token:", response.accessToken);
                // Save the token in your extension state and Chrome storage
                setSettings((prev) => ({ ...prev, apiToken: response.accessToken }));
                chrome.storage.local.set({ apiToken: response.accessToken }, () => {
                    console.log("Access token saved.");
                });
            } else {
                console.error("OAuth failed:", response ? response.error : "No response");
            }
            setIsLoading(false);
        });
    };

    const handleSignOut = () => {
        setIsLoading(true);
        // Remove stored settings related to ClickUp, including the token and other keys
        chrome.storage.local.remove(
            [
                "apiToken",
                "selectedTeam",
                "selectedSpace",
                "selectedFolder",
                "selectedList",
                "fieldMappings",
                "selectedFieldIds"  // Also clear the selected fields from storage if stored
            ],
            () => {
                if (chrome.runtime.lastError) {
                    console.error("Error removing keys from storage:", chrome.runtime.lastError);
                } else {
                    console.log("Token, settings, and selected fields removed from storage.");
                }
                // Clear settings in memory.
                setSettings({
                    apiToken: "",
                    selectedTeam: "",
                    selectedSpace: "",
                    selectedFolder: null,
                    selectedList: "",
                    fieldMappings: {},
                });
                // Also clear the selected field IDs using the passed in callback.
                clearSelectedFields();
                setIsLoading(false);
            }
        );
    };

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
                <button
                    onClick={handleSignOut}
                    className="w-full p-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                    Sign Out of ClickUp
                </button>
            ) : (
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