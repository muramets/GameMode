import { useMemo } from 'react';
import type { Protocol } from '../types';
import { GROUP_CONFIG } from '../../../constants/common';

/**
 * Hook для группировки и сортировки протоколов
 * 
 * Бизнес-логика:
 * - Группирует протоколы по их группам
 * - Протоколы без группы попадают в группу "ungrouped"
 * - Внутри каждой группы протоколы сортируются по полю "order"
 * - Порядок групп определяется groupOrder из метаданных или GROUP_CONFIG
 */
export function useProtocolsGrouping(
    filteredProtocols: Protocol[],
    groupOrder: string[]
) {
    /**
     * Группирует и сортирует протоколы
     * 
     * Процесс:
     * 1. Сортируем все протоколы по полю "order" (для правильного порядка внутри группы)
     * 2. Группируем по полю "group" (или "ungrouped")
     * 3. Сортируем группы согласно groupOrder
     * 
     * Результат: массив кортежей [имя_группы, массив_протоколов]
     */
    const groupedProtocols = useMemo(() => {
        const groups: Record<string, Protocol[]> = {};

        // Шаг 1: Сортируем протоколы по order внутри каждой группы
        const sortedProtocols = [...filteredProtocols].sort(
            (a, b) => (a.order ?? 9999) - (b.order ?? 9999)
        );

        // Шаг 2: Группируем протоколы
        sortedProtocols.forEach(p => {
            const groupName = p.group || 'ungrouped';
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(p);
        });

        // Шаг 3: Определяем порядок сортировки групп
        // Используем groupOrder из store, если он есть, иначе fallback к GROUP_CONFIG
        const dynamicSortOrder = groupOrder.length > 0
            ? groupOrder
            : Object.keys(GROUP_CONFIG);

        // Шаг 4: Сортируем группы согласно заданному порядку
        return Object.entries(groups).sort(([keyA], [keyB]) => {
            const indexA = dynamicSortOrder.indexOf(keyA);
            const indexB = dynamicSortOrder.indexOf(keyB);

            // Оба в списке - сортируем по индексу
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            // keyA в списке, keyB нет - keyA первый
            if (indexA !== -1) return -1;
            // keyB в списке, keyA нет - keyB первый
            if (indexB !== -1) return 1;
            // Оба не в списке - сортируем по алфавиту
            return keyA.localeCompare(keyB);
        });
    }, [filteredProtocols, groupOrder]);

    /**
     * Извлекает уникальные названия групп и сортирует их
     * 
     * Используется для:
     * - Отображения списка групп в filter dropdown
     * - Сохранения правильного порядка групп при DnD
     */
    const protocolGroups = useMemo(() => {
        // Извлекаем все уникальные группы (кроме null/undefined)
        const groups = new Set(
            filteredProtocols
                .map((p: Protocol) => p.group)
                .filter(Boolean)
        );

        // Сортируем группы согласно groupOrder
        return Array.from(groups).sort((a, b) => {
            if (!a || !b) return 0;

            const idxA = groupOrder.indexOf(a as string);
            const idxB = groupOrder.indexOf(b as string);

            // Оба в списке - сортируем по индексу
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            // a в списке, b нет - a первый
            if (idxA !== -1) return -1;
            // b в списке, a нет - b первый
            if (idxB !== -1) return 1;
            // Оба не в списке - сортируем по алфавиту
            return (a as string).localeCompare(b as string);
        });
    }, [filteredProtocols, groupOrder]);

    return {
        groupedProtocols,
        protocolGroups,
    };
}
