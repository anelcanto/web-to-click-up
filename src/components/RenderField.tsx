import React, { useCallback, useEffect } from 'react';

interface FieldOption {
    id: string;
    name: string;
}

export interface Field {
    id: string;
    name: string;
    type?: string;
    options?: FieldOption[];
}

interface RenderFieldProps {
    field: Field;
    value: string;
    onChange: (fieldId: string, value: string) => void;
    urlOption?: string; // "manual" or "current"
    onUrlOptionChange?: (fieldId: string, option: string) => void;
}

/**
 * Custom hook to keep a URL field up-to-date with the current tab URL.
 * It always runs, but will only perform actions if the field type is 'url' and urlOption is 'current'.
 */
const useCurrentTabUrl = (
    field: Field,
    value: string,
    urlOption: string | undefined,
    onChange: (fieldId: string, value: string) => void
) => {
    const fetchCurrentTabUrl = useCallback(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs.length > 0 && tabs[0].url) {
                const fetchedUrl = tabs[0].url;
                if (fetchedUrl !== value) {
                    onChange(field.id, fetchedUrl);
                }
            }
        });
    }, [field.id, onChange, value]);

    useEffect(() => {
        if (field.type === 'url' && urlOption === 'current') {
            fetchCurrentTabUrl();
        }
    }, [urlOption, field.type, fetchCurrentTabUrl]);

    useEffect(() => {
        if (field.type !== 'url' || urlOption !== 'current') return;

        const handleTabActivated = () => {
            fetchCurrentTabUrl();
        };

        chrome.tabs.onActivated.addListener(handleTabActivated);

        return () => {
            chrome.tabs.onActivated.removeListener(handleTabActivated);
        };
    }, [field.type, urlOption, fetchCurrentTabUrl]);

    useEffect(() => {
        if (field.type !== 'url' || urlOption !== 'current') return;

        const handleTabUpdated = (
            tabId: number,
            changeInfo: chrome.tabs.TabChangeInfo,
            tab: chrome.tabs.Tab
        ) => {
            if (changeInfo.status === 'complete' && tab.active) {
                fetchCurrentTabUrl();
            }
        };

        chrome.tabs.onUpdated.addListener(handleTabUpdated);

        return () => {
            chrome.tabs.onUpdated.removeListener(handleTabUpdated);
        };
    }, [field.type, urlOption, fetchCurrentTabUrl]);
};

const inputClass =
    'w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500';

export const RenderField: React.FC<RenderFieldProps> = ({
    field,
    value,
    onChange,
    urlOption,
    onUrlOptionChange,
}) => {
    // Always call the hook unconditionally.
    useCurrentTabUrl(field, value, urlOption, onChange);

    if (field.type === 'url') {
        const handleUrlOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            const selectedOption = e.target.value;
            if (onUrlOptionChange) {
                onUrlOptionChange(field.id, selectedOption);
            }
            if (selectedOption === 'manual') {
                onChange(field.id, '');
            }
        };

        return (
            <div className="space-y-1">
                <label className="block text-sm font-medium mb-1">{field.name}</label>
                <input
                    type="url"
                    placeholder={field.name}
                    value={value}
                    disabled={urlOption === 'current'}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className={inputClass}
                />
                <select
                    onChange={handleUrlOptionChange}
                    className={inputClass}
                    value={urlOption || 'manual'}
                >
                    <option value="manual">Enter URL manually</option>
                    <option value="current">Use current page URL</option>
                </select>
            </div>
        );
    }

    // For other field types, you can render based on a switch-case or similar logic.
    const commonProps = {
        placeholder: field.name,
        value,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            onChange(field.id, e.target.value),
        className: inputClass,
    };

    switch (field.type) {
        case 'drop_down':
            return (
                <select
                    {...commonProps}
                    value={value}
                    onChange={(e) => onChange(field.id, e.target.value)}
                >
                    <option value="">{`Select ${field.name}...`}</option>
                    {field.options?.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.name}
                        </option>
                    ))}
                </select>
            );
        // ... other field types
        default:
            return <input {...commonProps} type="text" />;
    }
};