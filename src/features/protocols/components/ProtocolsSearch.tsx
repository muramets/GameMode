import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

interface ProtocolsSearchProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

/**
 * Компонент поля поиска протоколов
 * 
 * Функциональность:
 * - Поиск работает в реальном времени (onChange)
 * - Иконка поиска слева от поля
 * - Placeholder подсказывает пользователю что можно искать
 */
export function ProtocolsSearch({ searchQuery, onSearchChange }: ProtocolsSearchProps) {
    return (
        <div className="relative group flex-grow md:flex-grow-0 ml-1">
            {/* Иконка поиска (абсолютное позиционирование слева) */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sub pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-sm" />
            </div>

            {/* Поле ввода с отступом слева для иконки */}
            <input
                type="text"
                placeholder="Search actions..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full md:w-64 pl-10 pr-4 py-3 bg-sub-alt rounded-lg outline-none text-text-primary placeholder:text-sub font-mono text-sm transition-colors duration-150 focus:bg-sub"
            />
        </div>
    );
}
