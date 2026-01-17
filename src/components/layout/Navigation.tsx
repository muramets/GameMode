import { useRef, useState } from 'react';
import { Home, List, BarChart2, Clock, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

/*
  Porting Notes:
  - Replicating #testConfig style from MonkeyType 1:1.
  - Using "cutout" spacers between items/groups.
  - Font size 0.75rem (text-xs).
  - Fixed height to match legacy (39px).
  - Transition 125ms.
*/

// Spacer component matching .spacer in test.scss
// Vertically centered, fixed height relative to container
function Spacer() {
    return (
        <div className="w-1.5 h-4 my-auto bg-bg-primary rounded-full" />
    );
}

export function Navigation() {
    const location = useLocation();
    const [isInnerfacesExpanded, setIsInnerfacesExpanded] = useState(false);
    const expandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isActive = (path: string) => location.pathname === path;

    const handleMouseEnter = () => {
        if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
        setIsInnerfacesExpanded(true);
    };

    const handleMouseLeave = () => {
        expandTimeoutRef.current = setTimeout(() => {
            setIsInnerfacesExpanded(false);
        }, 300);
    };

    // Style matching #testConfig .textButton from test.scss
    // px-3 (1em), gap-2 (0.5em icon gap), duration 125ms
    // Font: 11px (0.7rem approx) to match "smaller" look, leading-tight (1.25)
    const baseItemClasses = "flex items-center gap-2 px-3 h-full border-none bg-transparent cursor-pointer font-mono text-[11px] transition-colors duration-[125ms] outline-none leading-tight select-none";
    const activeClasses = "text-main hover:text-text-primary";
    const inactiveClasses = "text-text-secondary hover:text-text-primary";

    return (
        <nav className="flex justify-center w-full select-none">
            {/* Main container: Fixed 39px height, gap-2 for spacing between items/spacers */}
            {/* draggable={false} prevents the "ghost image" when dragging nav items, ensuring a native app feel */}
            <div className="flex items-stretch h-[39px] bg-sub-alt rounded-lg overflow-visible shadow-sm">

                {/* Dashboard */}
                <Link
                    draggable={false}
                    to="/"
                    className={`${baseItemClasses} rounded-l-lg ${isActive('/') ? activeClasses : inactiveClasses}`}
                >
                    <Home
                        className="w-3.5 h-3.5"
                        fill={isActive('/') ? "currentColor" : "none"}
                    />
                    <span>dashboard</span>
                </Link>

                <Spacer />

                {/* Actions */}
                <Link
                    draggable={false}
                    to="/actions"
                    onClick={() => {
                        const now = performance.now();
                        (window as unknown as { __navStart: number }).__navStart = now;
                        console.log(`[PERF][1] Navigation: Clicked protocols at ${now.toFixed(2)}ms`);
                    }}
                    className={`${baseItemClasses} ${isActive('/actions') ? activeClasses : inactiveClasses}`}
                >
                    <List
                        className="w-3.5 h-3.5"
                        strokeWidth={isActive('/actions') ? 3 : 2}
                    />
                    <span>actions</span>
                </Link>

                <Spacer />

                {/* Powers Group */}
                <div
                    className="flex relative group h-full"
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Powers Main Link */}
                    <Link
                        draggable={false}
                        to="/powers"
                        className={`${baseItemClasses} z-20 relative ${isActive('/powers') ? activeClasses : inactiveClasses}`}
                    >
                        <BarChart2
                            className="w-3.5 h-3.5"
                            strokeWidth={isActive('/powers') ? 3 : 2}
                        />
                        <span>powers</span>
                    </Link>

                    {/* Expand Arrow - Integrated */}
                    <button
                        className={`
                            bg-transparent border-none text-sub px-2 h-full cursor-pointer transition-all duration-250
                            flex items-center justify-center outline-none opacity-50 z-20 relative
                            hover:text-text-primary hover:opacity-100
                            ${(isInnerfacesExpanded || isActive('/history')) ? 'text-main opacity-100' : ''}
                        `}
                        onMouseEnter={handleMouseEnter}
                        title="Show history"
                        draggable={false}
                    >
                        <ChevronRight className="w-3 h-3" />
                    </button>

                    {/* History Link (Expandable Slide-out) */}
                    <Link
                        draggable={false}
                        to="/history"
                        className={`
                            absolute top-0 left-full h-full flex items-center gap-2 whitespace-nowrap overflow-hidden
                            bg-transparent z-10 border-none
                            font-mono text-xs leading-none
                            ${isActive('/history') ? 'text-main' : 'text-sub hover:text-text-primary'}
                            transition-all duration-300 ease-[cubic-bezier(0.4,0.0,0.2,1)]
                        `}
                        style={{
                            width: (isInnerfacesExpanded || isActive('/history')) ? 'auto' : '0px',
                            minWidth: (isInnerfacesExpanded || isActive('/history')) ? '100px' : '0px',
                            padding: (isInnerfacesExpanded || isActive('/history')) ? '0 1rem' : '0',
                            opacity: (isInnerfacesExpanded || isActive('/history')) ? 1 : 0,
                            transform: (isInnerfacesExpanded || isActive('/history')) ? 'translateX(0)' : 'translateX(-10px)',
                            pointerEvents: (isInnerfacesExpanded || isActive('/history')) ? 'auto' : 'none',
                        }}
                    >
                        <Clock
                            className="w-3.5 h-3.5"
                            strokeWidth={isActive('/history') ? 3 : 2}
                        />
                        <span>history</span>
                    </Link>

                    {/* Background Extension for History - Offset to fix gap issue */}
                    <div
                        className={`
                            absolute top-0 left-[85%] h-full bg-sub-alt rounded-r-lg
                            transition-all duration-[300ms] ease-[cubic-bezier(0.4,0.0,0.2,1)]
                            z-0 shadow-sm
                        `}
                        style={{
                            width: (isInnerfacesExpanded || isActive('/history')) ? '120px' : '0px',
                            opacity: (isInnerfacesExpanded || isActive('/history')) ? 1 : 0,
                            visibility: (isInnerfacesExpanded || isActive('/history')) ? 'visible' : 'hidden'
                        }}
                    />
                </div>

            </div>
        </nav>
    );
}

