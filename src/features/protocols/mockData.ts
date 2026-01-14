import type { Protocol, Innerface } from './types';

export const MOCK_INNERFACES: Innerface[] = [
    {
        id: 1,
        name: "Focus. Attentional control",
        icon: "🧘🏻",
        hover: "Ability to sustain attention and think deeply.",
        initialScore: 5.20,
        color: "#ca4754"
    },
    {
        id: 2,
        name: "Energy. Cognitive stamina",
        icon: "🔋",
        hover: "Mental fuel to start and stay engaged.",
        initialScore: 5.50,
        color: "#e6934a"
    },
    {
        id: 3,
        name: "Engagement. Impulse",
        icon: "⚡",
        hover: "It pulls you forward - without force.",
        initialScore: 5.90,
        color: "#e2b714"
    },
    {
        id: 4,
        name: "Body Sync. Body-driven confidence",
        icon: "🏃🏻‍♂️",
        hover: "When the body leads, the mind follows.",
        initialScore: 5.90,
        color: "#98c379"
    },
    {
        id: 5,
        name: "Business Insight. Strategic understanding",
        icon: "📊",
        hover: "The mental model of how things work and where value flows.",
        initialScore: 5.30,
        color: "#7fb3d3"
    },
    {
        id: 6,
        name: "Execution Speed. Learn and apply fast",
        icon: "🚄",
        hover: "Respond to change with flexible execution.",
        initialScore: 6.50
    },
    {
        id: 7,
        name: "Relationship. What lives between you",
        icon: "❤️",
        hover: "",
        initialScore: 6.00
    },
    {
        id: 8,
        name: "Family. What matters most",
        icon: "👨‍👩‍👧‍👦",
        hover: "The one bond that doesn't care who you are at work.",
        initialScore: 6.30
    },
    {
        id: 9,
        name: "Community. Not the crowd - the circle",
        icon: "🧩",
        hover: "Other minds run deep too. Find them.",
        initialScore: 5.20
    }
];

export const MOCK_PROTOCOLS: Protocol[] = [
    {
        id: 1,
        title: "Warm Up",
        description: "Turn the body on",
        icon: "🧍‍♂️",
        hover: "Wake the system.",
        action: "+",
        weight: 0.05,
        targets: [4, 2],
        group: "Physical",
        color: "#98c379"
    },
    {
        id: 2,
        title: "Meditation",
        description: "Engage with yourself",
        icon: "🧘‍♂️",
        hover: "Build presence through attention.",
        action: "+",
        weight: 0.05,
        targets: [1, 2, 3],
        group: "Mental",
        color: "#ca4754"
    },
    {
        id: 3,
        title: "Short Walk",
        description: "Reset through motion",
        icon: "🚶‍♂️",
        hover: "20-minute walk to ground the mind and release tension.",
        action: "+",
        weight: 0.03,
        targets: [4],
        group: "Physical",
        color: "#98c379"
    },
    {
        id: 4,
        title: "Long Run",
        description: "Reset through effort",
        icon: "👟",
        hover: "60-minute run to rebuild clarity and trust in the body.",
        action: "+",
        weight: 0.1,
        targets: [4],
        group: "Physical",
        color: "#98c379"
    },
    {
        id: 5,
        title: "Sauna / Bath",
        description: "Clear the chamber",
        icon: "🧖‍♂️",
        hover: "",
        action: "+",
        weight: 0.05,
        targets: [2, 1, 4],
        group: "Recovery",
        color: "#7fb3d3"
    },
    {
        id: 6,
        title: "Clear your head",
        description: "Cognitive Dump",
        icon: "🌀",
        hover: "Open a blank screen → write whatever's in your head. No filter. Just let it pour for 3-5 minutes.",
        action: "+",
        weight: 0.05,
        targets: [1, 2],
        group: "Mental",
        color: "#7fb3d3"
    },
    {
        id: 7,
        title: "Get in the zone",
        description: "Context Immersion",
        icon: "🎧",
        hover: "1. Play an audio cue that links to past focus.\n2. Open an old project/file/idea where you were locked in - just for 5 minutes.\n3. Don't work. Just look.\n📍 Make the entry light: one small clear step → a sense of progress → you're warming up.",
        action: "+",
        weight: 0.1,
        targets: [1, 2],
        group: "Work",
        color: "#e2b714"
    },
    {
        id: 9,
        title: "Reboot the map",
        description: "Visual Restart",
        icon: "🔁",
        hover: "1. Open a big whiteboard (FigJam, Miro).\n2. Drop this in the center: What's blocking me?\n3. Map out arrows, blocks, \"if only...\", \"to get...\", feelings, fragments, images.",
        action: "+",
        weight: 0.1,
        targets: [1, 3],
        group: "Mental",
        color: "#ca4754"
    },
    {
        id: 20,
        title: "Read",
        description: "Draw from the source",
        icon: "📖",
        hover: "You don't have to make it up. It's already there.",
        action: "+",
        weight: 0.15,
        targets: [3, 2, 5],
        group: "Learning",
        color: "#e2b714"
    },
    {
        id: 22,
        title: "Weed",
        description: "Half out by design",
        icon: "💨",
        hover: "You step off. Not to fall apart - just to float for a while.",
        action: "-",
        weight: 0.2,
        targets: [4, 6, 7],
        group: "Substances",
        color: "#ca4754"
    }
];
