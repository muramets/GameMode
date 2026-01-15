import { useState, useRef, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Protocol, Innerface } from './types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faCog, faHistory } from '@fortawesome/free-solid-svg-icons';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../../components/ui/atoms/Tooltip';
import { renderIcon } from '../../utils/iconMapper';

interface ProtocolRowProps {
    protocol: Protocol;
    innerfaces: Innerface[];
    onLevelUp: (id: string | number) => void;
    onLevelDown: (id: string | number) => void;
    onEdit: (id: string | number) => void;
}

export function ProtocolRow({ protocol, innerfaces, onLevelUp, onLevelDown, onEdit }: ProtocolRowProps) {
    const navigate = useNavigate();
    const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);
    const rowRef = useRef<HTMLDivElement>(null);

    // Resolve targets
    const targetInnerfaces = protocol.targets.map(id => innerfaces.find(i => i.id === id)).filter(Boolean) as Innerface[];


    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!rowRef.current) return;
        const rect = rowRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const center = rect.width / 2;
        const deadZone = 10; // Total 20px (10px each side)

        if (x < center - deadZone) {
            setHoverSide('left');
        } else if (x > center + deadZone) {
            setHoverSide('right');
        } else {
            setHoverSide(null);
        }
    };

    const handleMouseLeave = () => {
        setHoverSide(null);
    };

    const handleClick = () => {
        if (hoverSide === 'left') {
            onLevelDown(protocol.id);
        } else if (hoverSide === 'right') {
            onLevelUp(protocol.id);
        }
    };

    return (
        <div
            ref={rowRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            className="group relative h-[72px] bg-sub-alt border border-transparent rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.005] select-none cursor-pointer"
        >
            {/* 1. Dynamic Hover Gradients (Side Interaction) */}
            <div
                className={`absolute inset-0 bg-[radial-gradient(circle_at_100%_50%,_rgba(152,195,121,0.15),_transparent_60%)] transition-opacity duration-300 ${hoverSide === 'right' ? 'opacity-100' : 'opacity-0'}`}
            />
            <div
                className={`absolute inset-0 bg-[radial-gradient(circle_at_0%_50%,_rgba(202,71,84,0.15),_transparent_60%)] transition-opacity duration-300 ${hoverSide === 'left' ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Subtly separate rows without hover */}
            <div className="absolute bottom-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-text-primary/5 to-transparent group-hover:opacity-0 transition-opacity" />

            {/* 2. Visual Layer: Big Icons on Sides (Always visible) */}
            <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none z-10">
                {/* Left Icon: Minus */}
                <div className={`transition-all duration-300 flex items-center justify-center w-8 h-8 rounded-full ${hoverSide === 'left'
                    ? 'opacity-100 scale-125 text-[#ca4754]'
                    : 'opacity-40 text-sub scale-100'
                    }`}>
                    <FontAwesomeIcon icon={faMinus} />
                </div>

                {/* Right Icon: Plus */}
                <div className={`transition-all duration-300 flex items-center justify-center w-8 h-8 rounded-full ${hoverSide === 'right'
                    ? 'opacity-100 scale-125 text-[#98c379]'
                    : 'opacity-40 text-sub scale-100'
                    }`}>
                    <FontAwesomeIcon icon={faPlus} />
                </div>
            </div>

            {/* 3. Centered XP/Weight Display */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <span className={`font-lexend text-xs font-bold tracking-wider transition-all duration-300 ${hoverSide === 'right' ? 'text-[#98c379] opacity-100' :
                    hoverSide === 'left' ? 'text-[#ca4754] opacity-100' :
                        'text-sub opacity-40 group-hover:text-text-primary group-hover:opacity-100'
                    }`}>
                    {protocol.weight} XP
                </span>
            </div>

            {/* 4. Content Layer */}
            <div className="absolute inset-0 flex items-center px-4 z-20 pointer-events-none">

                {/* Icon */}
                <div
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-bg-primary/50 text-xl shadow-inner shrink-0 transition-colors duration-300 ml-8"
                    style={{ color: protocol.color || 'var(--text-color)' }}
                >
                    {renderIcon(protocol.icon)}
                </div>

                {/* Text Info - Passthrough interactions to parent */}
                <div className="flex flex-col ml-4 flex-grow min-w-0 pr-20"> {/* pr-20 to avoid overlap with center XP if title is long */}
                    <div className="flex items-center gap-2">
                        <h3 className={`font-lexend text-base font-medium truncate transition-colors duration-300 ${hoverSide === 'right' ? 'text-[#98c379]' :
                            hoverSide === 'left' ? 'text-[#ca4754]' :
                                'text-text-primary'
                            }`}>
                            {protocol.title}
                        </h3>

                    </div>
                    <div className="text-xs text-text-secondary truncate font-mono opacity-80 max-w-[240px] transition-colors duration-300 group-hover:text-text-primary group-hover:opacity-100">
                        {protocol.description}
                    </div>
                </div>

                {/* Right Side Meta (Targets, Actions) */}
                <div className="flex items-center gap-3 mr-10 pointer-events-auto">
                    {/* Targets (Legacy Pill Style) */}
                    <div className="hidden md:flex items-center gap-1.5">
                        {targetInnerfaces.map(innerface => (
                            <TooltipProvider key={innerface.id} delayDuration={300}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="px-2 py-0.5 rounded-md bg-bg-primary border border-sub-alt flex items-center gap-1.5 transition-transform hover:scale-105 cursor-help"
                                        >
                                            <div className="text-[0.7rem]" style={{ color: innerface.color }}>
                                                {renderIcon(innerface.icon)}
                                            </div>
                                            <span
                                                className="uppercase font-mono text-[0.6rem] font-bold tracking-wider"
                                                style={{ color: innerface.color || 'var(--sub-color)' }}
                                            >
                                                {innerface.name.split('.')[0]}
                                            </span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        <span className="font-mono text-xs">{innerface.name}</span>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/history?protocolId=${protocol.id}`);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded text-sub hover:text-main transition-colors cursor-pointer"
                            title="History"
                        >
                            <FontAwesomeIcon icon={faHistory} className="text-xs" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(protocol.id); }}
                            className="w-8 h-8 flex items-center justify-center rounded text-sub hover:text-main transition-colors cursor-pointer"
                            title="Edit"
                        >
                            <FontAwesomeIcon icon={faCog} className="text-xs" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
