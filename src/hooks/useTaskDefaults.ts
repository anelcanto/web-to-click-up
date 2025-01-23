// src/hooks/useTaskDefaults.ts
import { useState, useEffect, useCallback } from 'react';

interface Defaults {
    taskName: string;
    fieldValues: Record<string, string>;
    fieldUrlOptions: Record<string, string>;
}

const useTaskDefaults = () => {
    const [taskName, setTaskName] = useState('');
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
    const [fieldUrlOptions, setFieldUrlOptions] = useState<Record<string, string>>({});
    const [statusMsg, setStatusMsg] = useState('');

    const loadDefaults = useCallback(() => {
        console.log('[useTaskDefaults] loadDefaults invoked.');
        chrome.storage.local.get(['defaults'], (result) => {
            console.log('[useTaskDefaults] Chrome storage get defaults:', result.defaults);
            if (result.defaults) {
                const { taskName: defaultTaskName, fieldValues: defaultFieldValues, fieldUrlOptions: defaultFieldUrlOptions } = result.defaults;
                if (defaultTaskName) {
                    console.log('[useTaskDefaults] Setting taskName from defaults:', defaultTaskName);
                    setTaskName(defaultTaskName);
                }
                if (defaultFieldValues) {
                    console.log('[useTaskDefaults] Setting fieldValues from defaults:', defaultFieldValues);
                    setFieldValues(defaultFieldValues);
                }
                if (defaultFieldUrlOptions) {
                    console.log('[useTaskDefaults] Setting fieldUrlOptions from defaults:', defaultFieldUrlOptions);
                    setFieldUrlOptions(defaultFieldUrlOptions);
                }
            }
        });
    }, []);

    const saveDefaults = useCallback(() => {
        console.log('[useTaskDefaults] saveDefaults invoked.');
        const filteredFieldValues = { ...fieldValues };
        Object.keys(fieldUrlOptions).forEach((fieldId) => {
            if (fieldUrlOptions[fieldId] === "current") {
                console.log(`[useTaskDefaults] For field ${fieldId}, URL option is "current" – clearing the saved value.`);
                filteredFieldValues[fieldId] = '';
            }
        });

        const defaults: Defaults = {
            taskName,
            fieldValues: filteredFieldValues,
            fieldUrlOptions,
        };
        console.log('[useTaskDefaults] saveDefaults:', defaults);
        chrome.storage.local.set({ defaults }, () => {
            console.log('[useTaskDefaults] Defaults saved to Chrome storage.');
            setStatusMsg('Defaults saved!');
            setTimeout(() => setStatusMsg(''), 2000);
        });
    }, [taskName, fieldValues, fieldUrlOptions]);

    const clearDefaults = useCallback(() => {
        console.log('[useTaskDefaults] clearDefaults invoked.');
        chrome.storage.local.remove(['defaults'], () => {
            console.log('[useTaskDefaults] Defaults removed from Chrome storage.');
            setTaskName('');
            setFieldValues({});
            setFieldUrlOptions({});
            loadDefaults();
            setStatusMsg('Defaults cleared and reloaded!');
            setTimeout(() => setStatusMsg(''), 2000);
        });
    }, [loadDefaults]);

    useEffect(() => {
        loadDefaults();
    }, [loadDefaults]);

    return {
        taskName,
        setTaskName,
        fieldValues,
        setFieldValues,
        fieldUrlOptions,
        setFieldUrlOptions,
        statusMsg,
        saveDefaults,
        clearDefaults,
    };
};

export default useTaskDefaults;