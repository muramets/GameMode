import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../../../components/ui/atoms/Tooltip';
import { Input } from '../../../components/ui/molecules/Input';
import { ProtocolsFilterDropdown } from './ProtocolsFilterDropdown';

interface ProtocolsToolbarProps {
    onAddProtocol: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    activeFilters: string[];
    protocolGroups: string[];
    onToggleFilter: (filter: string) => void;
    shouldShowSearch?: boolean;
}

/**
 * Компонент тулбара для управления протоколами
 * 
 * Содержит:
 * - Кнопку добавления нового протокола (с tooltip)
 * - Dropdown фильтр по группам
 * - Поле поиска
 * 
 * Responsive:
 * - На мобильных: full width поле поиска
 * - На desktop: фиксированная ширина поиска (w-64)
 */
export function ProtocolsToolbar({
    onAddProtocol,
    searchQuery,
    onSearchChange,
    activeFilters,
    protocolGroups,
    onToggleFilter,
    shouldShowSearch = true,
}: ProtocolsToolbarProps) {
    return (
        <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-0">
                {/* Кнопка "Add Protocol" с tooltip */}
                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={onAddProtocol}
                                className="h-[46px] w-[36px] flex items-center justify-center rounded-lg text-sub hover:text-main transition-all cursor-pointer"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-xl" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <span className="font-mono text-xs">Add Action</span>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Dropdown фильтр */}
                <ProtocolsFilterDropdown
                    activeFilters={activeFilters}
                    protocolGroups={protocolGroups}
                    onToggleFilter={onToggleFilter}
                />
            </div>

            {/* Поле поиска */}
            {shouldShowSearch && (
                <div className="flex-grow md:flex-grow-0 ml-1">
                    <Input
                        icon={faSearch}
                        placeholder="Search actions..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="md:w-64"
                    />
                </div>
            )}
        </div>
    );
}
