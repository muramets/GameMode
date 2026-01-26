import { Extension } from '@tiptap/react'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import clsx from 'clsx'

// Custom extension for collapsable headers
export const CollapsableHeadings = Extension.create({
    name: 'collapsableHeadings',

    addOptions() {
        return {
            levels: [1, 2, 3, 4, 5, 6],
        }
    },

    addGlobalAttributes() {
        return [
            {
                types: ['heading'],
                attributes: {
                    collapsed: {
                        default: false,
                        parseHTML: element => element.getAttribute('data-collapsed') === 'true',
                        renderHTML: attributes => {
                            if (!attributes.collapsed) return {}
                            return { 'data-collapsed': 'true' }
                        },
                    },
                },
            },
        ]
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('collapsableHeadings'),
                props: {
                    decorations: (state) => {
                        const decorations: Decoration[] = []
                        const { doc } = state

                        // Track the current collapse level.
                        // null means we are NOT currently inside a collapsed section.
                        // number means we are inside a collapsed section started by a header of this level.
                        let collapsedLevel: number | null = null

                        doc.descendants((node, pos) => {
                            if (node.type.name === 'heading') {
                                const level = node.attrs.level

                                // Check if this new header breaks out of the current collapsed section
                                // A header breaks out if its level is <= the level that started the collapse.
                                // E.g. H1 starts collapse. H2 comes (2 > 1, stays collapsed). H1 comes (1 <= 1, breaks out).
                                if (collapsedLevel !== null && level <= collapsedLevel) {
                                    collapsedLevel = null
                                }

                                if (collapsedLevel !== null) {
                                    // We are still inside a collapsed section, hide this header
                                    decorations.push(
                                        Decoration.node(pos, pos + node.nodeSize, {
                                            class: 'collapsed-content',
                                            style: 'display: none !important'
                                        })
                                    )
                                } else {
                                    // Node is visible. Check if IT starts a new collapse.
                                    if (node.attrs.collapsed) {
                                        collapsedLevel = level
                                    }

                                    // Add toggle decoration to headers
                                    decorations.push(
                                        Decoration.widget(pos + 1, (view) => {
                                            const icon = document.createElement('span')

                                            // Calculate vertical center offset based on heading line-height
                                            // H1 (32px): (32-20)/2 = 6px (top-1.5)
                                            // H2 (28px): (28-20)/2 = 4px (top-1)
                                            // H3 (28px): (28-20)/2 = 4px (top-1)
                                            // H4 (24px): (24-20)/2 = 2px (top-0.5)
                                            // H5 (20px): (20-20)/2 = 0px (top-0)
                                            // H6 (16px): (16-20)/2 = -2px (-top-0.5)
                                            const topClass =
                                                level === 1 ? "top-1.5" :
                                                    level === 2 || level === 3 ? "top-1" :
                                                        level === 4 ? "top-0.5" :
                                                            level === 5 ? "top-0" :
                                                                "-top-0.5";

                                            icon.className = clsx(
                                                "absolute left-0 flex items-center justify-start w-5 h-5 cursor-pointer transition-all duration-200 text-sub hover:text-text-primary z-50",
                                                topClass,
                                                node.attrs.collapsed ? "-rotate-90" : "rotate-0"
                                            )
                                            // Match FontAwesome faChevronDown look
                                            icon.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`

                                            icon.onmousedown = (e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                            }

                                            icon.onclick = (e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                const { tr } = view.state
                                                const isCollapsed = !!node.attrs.collapsed
                                                tr.setNodeMarkup(pos, undefined, {
                                                    ...node.attrs,
                                                    collapsed: !isCollapsed
                                                })
                                                view.dispatch(tr)
                                            }
                                            return icon
                                        }, { side: -1 })
                                    )
                                }
                            } else {
                                // Non-heading content
                                if (collapsedLevel !== null) {
                                    // Inside collapsed section -> Hide
                                    decorations.push(
                                        Decoration.node(pos, pos + node.nodeSize, {
                                            class: 'collapsed-content',
                                            style: 'display: none !important'
                                        })
                                    )
                                }
                            }
                        })

                        return DecorationSet.create(doc, decorations)
                    },
                },
            }),
        ]
    },
})
