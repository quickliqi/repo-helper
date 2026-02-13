import React from 'react';
import { cn } from '@/lib/utils';

interface NumberDisplayProps {
    value: number | null | undefined;
    className?: string;
    placeholder?: string;
}

export const CurrencyDisplay: React.FC<NumberDisplayProps & { fractionDigits?: number }> = ({
    value,
    className,
    placeholder = '-',
    fractionDigits = 0
}) => {
    if (value === null || value === undefined) {
        return <span className={cn("text-muted-foreground", className)}>{placeholder}</span>;
    }

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: fractionDigits,
        minimumFractionDigits: fractionDigits,
    });

    return <span className={cn("font-variant-numeric: tabular-nums", className)}>{formatter.format(value)}</span>;
};

export const PercentDisplay: React.FC<NumberDisplayProps> = ({
    value,
    className,
    placeholder = '-'
}) => {
    if (value === null || value === undefined) {
        return <span className={cn("text-muted-foreground", className)}>{placeholder}</span>;
    }

    // Expecting value as 0-100, not 0-1
    const formatted = new Intl.NumberFormat('en-US', {
        style: 'percent',
        maximumFractionDigits: 1,
    }).format(value / 100);

    return <span className={cn("font-variant-numeric: tabular-nums", className)}>{formatted}</span>;
};
