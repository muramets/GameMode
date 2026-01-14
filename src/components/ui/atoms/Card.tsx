import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export function Card({ children, className = '' }: CardProps) {
    return (
        <div className={`bg-bg-secondary rounded-lg p-6 shadow-md border border-transparent ${className}`}>
            {children}
        </div>
    );
}
