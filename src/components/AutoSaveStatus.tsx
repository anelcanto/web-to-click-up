// src/components/AutoSaveStatus.tsx
import React from 'react';
import { CloudArrowDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
interface AutoSaveStatusProps {
  isSyncing: boolean;
  className: string
}

export default function AutoSaveStatus({ isSyncing, className }: AutoSaveStatusProps) {
  return (
    <div className={`${className} flex items-center space-x-1`}>
      {isSyncing ? (
        <>
          <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />
          <span className="text-sm text-blue-500">Syncing…</span>
        </>
      ) : (
        <>
          <CloudArrowDownIcon className="h-5 w-5 text-green-500" />
          <span className="text-sm text-green-500">Saved</span>
        </>
      )
      }
    </div >
  );
}
