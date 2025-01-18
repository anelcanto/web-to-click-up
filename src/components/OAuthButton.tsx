import { Settings } from "../types";

interface SetttingsProp {
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}
export default function OAuthButton({ setSettings }: SetttingsProp) {
    // Example "Connect ClickUp" button (OAuth) – optional
    const handleConnectClickup = () => {
        chrome.runtime.sendMessage({ action: 'startOAuth' }, (response) => {
            if (response.success) {
                console.log('OAuth successful! Access token:', response.accessToken);
                // Save the token in your extension state or local storage
                setSettings((prev) => ({ ...prev, apiToken: response.accessToken }));
            } else {
                console.error('OAuth failed:', response.error);
            }
        });
    };

    return (
        < div className="flex items-center space-x-2 mb-2" >
            <button
                onClick={handleConnectClickup}
                className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
                Connect ClickUp
            </button>
        </div >
    )

}