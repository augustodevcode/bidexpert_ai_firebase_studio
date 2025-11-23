// src/components/common/logged-entity-selector.tsx
/**
 * Entity selector wrapper with automatic logging
 */
'use client';

import React from 'react';
import EntitySelector from '@/components/ui/entity-selector';
import { logSelection } from '@/lib/user-action-logger';

interface LoggedEntitySelectorProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  options: Array<{ id: string; name: string; [key: string]: any }>;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  moduleName: string;
  entityType: string; // e.g., 'process', 'auctioneer', 'category'
  className?: string;
}

export function LoggedEntitySelector({
  value,
  onValueChange,
  options,
  label,
  placeholder,
  disabled,
  required,
  moduleName,
  entityType,
  className,
}: LoggedEntitySelectorProps) {
  const handleValueChange = (newValue: string | null) => {
    // Log the selection
    const selectedItem = options.find(opt => opt.id === newValue);
    
    if (newValue) {
      logSelection(
        `${entityType} selected`,
        {
          id: newValue,
          name: selectedItem?.name || 'Unknown',
          label,
        },
        moduleName
      );
    } else {
      logSelection(
        `${entityType} cleared`,
        { label },
        moduleName
      );
    }

    // Call original handler
    onValueChange(newValue);
  };

  return (
    <EntitySelector
      value={value}
      onValueChange={handleValueChange}
      options={options}
      label={label}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={className}
    />
  );
}
