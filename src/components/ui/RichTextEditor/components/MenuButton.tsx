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
    /** Whether the button is disabled */
    disabled?: boolean
    /** Icon or content to display in the button */
    children: React.ReactNode
    /** Tooltip text shown on hover */
    title: string
}

export const MenuButton = ({
    onClick,
    isActive,
    disabled,
    children,
    title
}: MenuButtonProps) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <button
                type="button"
                onMouseDown={(e) => e.preventDefault()} // Prevent focus loss from editor
                onClick={onClick}
                disabled={disabled}
                aria-label={title}
                aria-pressed={isActive}
                aria-disabled={disabled}
                className={clsx(
                    "p-1.5 rounded-md transition-colors",
                    disabled
                        ? "text-sub/30 cursor-not-allowed bg-transparent"
                        : "text-sub hover:text-text-primary hover:bg-sub/10",
                    isActive && !disabled && "bg-sub/20 text-text-primary"
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
