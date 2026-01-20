import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
    return (
        <div className={`bg-bg-secondary rounded-lg p-6 shadow-md border border-transparent ${className}`} {...props}>
            {children}
        </div>
    );
}
