import React from 'react';
import { ArrowLeftIcon, CogIcon } from '@heroicons/react/24/outline'; // Adjust icons as needed

interface NavButtonProps {
    label: string;
    icon: 'settings' | 'back';
    onClick: () => void;
}

export default function NavButton({ label, icon, onClick }: NavButtonProps) {
    const IconComponent = icon === 'settings' ? CogIcon : ArrowLeftIcon;

    return (
        <button
            onClick={onClick}
            className="flex items-center p-2 text-blue-700 hover:text-blue-900 transition"
        >
            <IconComponent className="w-6 h-6 mr-2" />
            <span>{label}</span>
        </button>
    );
}