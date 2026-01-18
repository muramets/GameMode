import { useState, useMemo } from 'react';
import type { Protocol } from '../types';
import type { Innerface } from '../../innerfaces/types';

/**
 * Hook для управления поиском и фильтрацией протоколов
 * 
 * Бизнес-логика:
 * - Поиск работает по названию протокола, группе и связанным innerfaces
 * - Фильтрация позволяет выбрать несколько групп одновременно
 * - Специальный фильтр "ungrouped" для протоколов без группы
 * - Фильтр "all" сбрасывает все активные фильтры
 */
export function useProtocolsFiltering(
    protocols: Protocol[],
    innerfaceMap: Map<string, Innerface>
) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    /**
     * Применяет фильтры и поиск к списку протоколов
     * 
     * Логика фильтрации:
     * 1. Если есть активные фильтры - показываем только протоколы из выбранных групп
     * 2. Если фильтр "ungrouped" - показываем протоколы без группы
     * 3. Поиск ищет по:
     *    - Названию протокола
     *    - Названию группы
     *    - Названиям связанных innerfaces (через innerfaceMap)
     */
    const filteredProtocols = useMemo(() => {
        let filtered = protocols;

        // Применяем фильтры по группам
        if (activeFilters.length > 0) {
            filtered = filtered.filter((p: Protocol) => {
                // Проверяем фильтр "ungrouped"
                if (activeFilters.includes('ungrouped') && !p.group) return true;
                // Проверяем фильтры конкретных групп
                if (p.group && activeFilters.includes(p.group)) return true;
                return false;
            });
        }

        // Если нет поискового запроса - возвращаем отфильтрованный список
        if (!searchQuery.trim()) return filtered;

        // Применяем поиск
        const query = searchQuery.toLowerCase();
        return filtered.filter((protocol: Protocol) => {
            // Поиск по названию протокола
            if (protocol.title.toLowerCase().includes(query)) return true;
            // Поиск по названию группы
            if (protocol.group?.toLowerCase().includes(query)) return true;
            // Поиск по связанным innerfaces
            // Проверяем каждый target (ID innerface) и ищем соответствие по имени
            return protocol.targets.some((id: string | number) =>
                innerfaceMap.get(id.toString())?.name.toLowerCase().includes(query)
            );
        });
    }, [protocols, searchQuery, activeFilters, innerfaceMap]);

    /**
     * Переключает фильтр (добавляет если нет, убирает если есть)
     * 
     * @param filter - ID группы или 'all' для сброса всех фильтров
     */
    const toggleFilter = (filter: string) => {
        // Специальный случай: "all" сбрасывает все фильтры
        if (filter === 'all') {
            setActiveFilters([]);
            return;
        }

        // Переключаем фильтр: если есть - убираем, если нет - добавляем
        setActiveFilters(prev =>
            prev.includes(filter)
                ? prev.filter(f => f !== filter)  // Убираем
                : [...prev, filter]               // Добавляем
        );
    };

    /**
     * Удаляет конкретный фильтр из активных
     * Используется при клике на chip в ActiveFiltersList
     */
    const removeFilter = (filter: string) => {
        setActiveFilters(prev => prev.filter(f => f !== filter));
    };

    /**
     * Сбрасывает все фильтры
     * Используется кнопкой "Clear all" в ActiveFiltersList
     */
    const clearAllFilters = () => {
        setActiveFilters([]);
    };

    return {
        searchQuery,
        setSearchQuery,
        activeFilters,
        toggleFilter,
        removeFilter,
        clearAllFilters,
        filteredProtocols,
    };
}
