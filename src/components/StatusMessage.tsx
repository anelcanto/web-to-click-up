// src/components/StatusMessage.tsx
import React from 'react';

interface StatusMessageProps {
    message: string;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ message }) => {
    return <p className="mt-2 text-sm text-red-600">{message}</p>;
};

export default StatusMessage;