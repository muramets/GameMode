import React from 'react'
import clsx from 'clsx'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../atoms/Tooltip'

/**
 * MenuButton Component
 * 
 * Reusable toolbar button with tooltip and active state styling.
 * Used throughout the RichTextEditor toolbar for formatting actions.
 */

interface MenuButtonProps {
    /** Click handler for the button */
    onClick: () => void
    /** Whether the button represents an active state (e.g., bold is active) */
    isActive?: boolean
    /** Icon or content to display in the button */
    children: React.ReactNode
    /** Tooltip text shown on hover */
    title: string
}

export const MenuButton = ({
    onClick,
    isActive,
    children,
    title
}: MenuButtonProps) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <button
                type="button"
                onMouseDown={(e) => e.preventDefault()} // Prevent focus loss from editor
                onClick={onClick}
                aria-label={title}
                aria-pressed={isActive}
                className={clsx(
                    "p-1.5 rounded-md transition-colors text-sub hover:text-text-primary hover:bg-sub/10",
                    isActive && "bg-sub/20 text-text-primary"
                )}
            >
                {children}
            </button>
        </TooltipTrigger>
        <TooltipContent>
            {title}
        </TooltipContent>
    </Tooltip>
)
