export interface MarkdownSection {
    title: string;
    level: number;
    content: string[];
}

export interface MarkdownParseResult {
    preamble: string;
    sections: MarkdownSection[];
}

/**
 * Parses a markdown string into sections based on headers.
 * Content before the first header is treated as a preamble.
 * 
 * @param markdown - The markdown string to parse.
 * @returns An object containing the preamble and an array of sections.
 */
export const parseMarkdownSections = (markdown: string): MarkdownParseResult => {
    if (!markdown) return { preamble: '', sections: [] };

    // Split by lines to process one by one
    const lines = markdown.split(/\r?\n/);
    const result: MarkdownSection[] = [];
    let currentSection: MarkdownSection | null = null;
    const preamble: string[] = [];

    lines.forEach(line => {
        // Match headers from level 1 to 6
        const headerMatch = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/);

        if (headerMatch) {
            // If we were building a section, push it to results
            if (currentSection) {
                result.push(currentSection);
            }

            // Start a new section
            currentSection = {
                title: headerMatch[2],
                level: headerMatch[1].length,
                content: []
            };
        } else if (currentSection) {
            // Append line to current section
            currentSection.content.push(line);
        } else {
            // Append line to preamble if no section started yet
            preamble.push(line);
        }
    });

    // Don't forget the last section
    if (currentSection) {
        result.push(currentSection);
    }

    return { preamble: preamble.join('\n'), sections: result };
};
