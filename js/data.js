// ===== data.js - RPG Therapy Data =====

const INITIAL_DATA = {
  protocols: [
    {
      id: 1,
      name: "Warm Up. Turn the body on",
      icon: "🧍‍♂️",
      hover: "Wake the system.",
      action: "+",
      weight: 0.05,
      targets: ["body_sync", "energy"]
    },
    {
      id: 2,
      name: "Meditation. Engage with yourself",
      icon: "🧘‍♂️",
      hover: "Build presence through attention.",
      action: "+",
      weight: 0.05,
      targets: ["focus", "energy", "engagement"]
    },
    {
      id: 3,
      name: "Short Walk. Reset through motion",
      icon: "🚶‍♂️",
      hover: "20-minute walk to ground the mind and release tension.",
      action: "+",
      weight: 0.03,
      targets: ["body_sync"]
    },
    {
      id: 4,
      name: "Long Run. Reset through effort",
      icon: "👟",
      hover: "60-minute run to rebuild clarity and trust in the body.",
      action: "+",
      weight: 0.1,
      targets: ["body_sync"]
    },
    {
      id: 5,
      name: "Sauna / Bath. Clear the chamber",
      icon: "🧖‍♂️",
      hover: "",
      action: "+",
      weight: 0.05,
      targets: ["energy", "focus", "body_sync"]
    },
    {
      id: 6,
      name: "Clear your head. Cognitive Dump",
      icon: "🌀",
      hover: "Open a blank screen → write whatever's in your head. No filter. Just let it pour for 3-5 minutes.",
      action: "+",
      weight: 0.05,
      targets: ["focus", "energy"]
    },
    {
      id: 7,
      name: "Get in the zone. Context Immersion",
      icon: "🎧",
      hover: "1. Play an audio cue that links to past focus.\n2. Open an old project/file/idea where you were locked in - just for 5 minutes.\n3. Don't work. Just look.\n📍 Make the entry light: one small clear step → a sense of progress → you're warming up.",
      action: "+",
      weight: 0.1,
      targets: ["focus", "energy"]
    },
    {
      id: 8,
      name: "One small step. Primitive Start",
      icon: "📦",
      hover: "1. Pick a task you don't want to touch.\n2. Do the dumbest possible move: start a file, write one line, make one search.\n3. Don't think - just make contact.\n📍 Take the tiniest action to reduce activation cost.",
      action: "+",
      weight: 0.1,
      targets: ["energy", "engagement"]
    },
    {
      id: 9,
      name: "Reboot the map. Visual Restart",
      icon: "🔁",
      hover: "1. Open a big whiteboard (FigJam, Miro).\n2. Drop this in the center: What's blocking me?\n3. Map out arrows, blocks, \"if only...\", \"to get...\", feelings, fragments, images.",
      action: "+",
      weight: 0.1,
      targets: ["focus", "engagement"]
    },
    {
      id: 10,
      name: "Lock In. Step into your next role",
      icon: "🎯",
      hover: "Not forever. Just try it like it's real.",
      action: "+",
      weight: 0.1,
      targets: ["business_insight", "execution_speed", "engagement"]
    },
    {
      id: 11,
      name: "Cut Smart. Know when enough is enough",
      icon: "✋",
      hover: "Energy's limited. Spend it where it pays.",
      action: "+",
      weight: 0.1,
      targets: ["energy", "focus", "engagement"]
    },
    {
      id: 12,
      name: "Audience Targeting. Know who it's for",
      icon: "🎯",
      hover: "Clarify the person behind the view - before you press upload.",
      action: "+",
      weight: 0.1,
      targets: ["business_insight"]
    },
    {
      id: 13,
      name: "Music Rights Knowledge. Know what's allowed",
      icon: "🧾",
      hover: "Don't guess the game. Learn how it's played.",
      action: "+",
      weight: 0.1,
      targets: ["business_insight"]
    },
    {
      id: 14,
      name: "AI for Coding. Think with tools",
      icon: "🤖",
      hover: "Use AI to code faster, test faster, think faster.",
      action: "+",
      weight: 0.05,
      targets: ["execution_speed", "business_insight"]
    },
    {
      id: 15,
      name: "AI Music Production. Let the tool stretch you",
      icon: "🎛",
      hover: "Less manual. More mental. You shape, it builds.",
      action: "+",
      weight: 0.1,
      targets: ["business_insight", "engagement", "execution_speed"]
    },
    {
      id: 16,
      name: "Show Up. Be there when it counts",
      icon: "❤️",
      hover: "Not perfect - just present, consistent, real.",
      action: "+",
      weight: 0.1,
      targets: ["relationship", "energy", "focus"]
    },
    {
      id: 17,
      name: "Family Call. Get out of your head",
      icon: "📞",
      hover: "They remind you who you are outside the grind.",
      action: "+",
      weight: 0.15,
      targets: ["family"]
    },
    {
      id: 18,
      name: "Look Around. You're not solo",
      icon: "🌐",
      hover: "Some people just remind you you're real.",
      action: "+",
      weight: 0.3,
      targets: ["community"]
    },
    {
      id: 19,
      name: "Fuel Balance. Don't push the system",
      icon: "🥗",
      hover: "Stay light, stay sharp.",
      action: "+",
      weight: 0.1,
      targets: ["body_sync", "energy", "focus"]
    },
    {
      id: 20,
      name: "Read. Draw from the source",
      icon: "📖",
      hover: "You don't have to make it up. It's already there.",
      action: "+",
      weight: 0.15,
      targets: ["engagement", "energy", "business_insight"]
    },
    {
      id: 21,
      name: "Sleep. Don't skip the reset",
      icon: "🛏",
      hover: "The work lands better when you're not fried.",
      action: "+",
      weight: 0.1,
      targets: ["energy", "focus", "body_sync"]
    },
    {
      id: 22,
      name: "Weed. Half out by design",
      icon: "💨",
      hover: "You step off. Not to fall apart - just to float for a while.",
      action: "-",
      weight: 0.2,
      targets: ["body_sync", "execution_speed", "relationship"]
    },
    {
      id: 23,
      name: "Alcohol. Something's off",
      icon: "🥃",
      hover: "Slows your game.",
      action: "-",
      weight: 0.25,
      targets: ["body_sync", "relationship", "energy"]
    }
  ],

  skills: [
    {
      id: "focus",
      name: "Focus. Attentional control",
      icon: "🧘🏻",
      hover: "Ability to sustain attention and think deeply.",
      initialScore: 5.20
    },
    {
      id: "energy",
      name: "Energy. Cognitive stamina",
      icon: "🔋",
      hover: "Mental fuel to start and stay engaged.",
      initialScore: 5.50
    },
    {
      id: "engagement",
      name: "Engagement. Impulse",
      icon: "⚡",
      hover: "It pulls you forward - without force.",
      initialScore: 5.90
    },
    {
      id: "body_sync",
      name: "Body Sync. Body-driven confidence",
      icon: "🏃🏻‍♂️",
      hover: "When the body leads, the mind follows.",
      initialScore: 5.90
    },
    {
      id: "business_insight",
      name: "Business Insight. Strategic understanding",
      icon: "📊",
      hover: "The mental model of how things work and where value flows.",
      initialScore: 5.30
    },
    {
      id: "execution_speed",
      name: "Execution Speed. Learn and apply fast",
      icon: "🚄",
      hover: "Respond to change with flexible execution.",
      initialScore: 6.50
    },
    {
      id: "relationship",
      name: "Relationship. What lives between you",
      icon: "❤️",
      hover: "",
      initialScore: 6.00
    },
    {
      id: "family",
      name: "Family. What matters most",
      icon: "👨‍👩‍👧‍👦",
      hover: "The one bond that doesn't care who you are at work.",
      initialScore: 6.30
    },
    {
      id: "community",
      name: "Community. Not the crowd - the circle",
      icon: "🧩",
      hover: "Other minds run deep too. Find them.",
      initialScore: 5.20
    }
  ],

  states: [
    {
      id: "mental_clarity",
      name: "Mental clarity. Cognitive Resource",
      icon: "🧠",
      hover: "Capacity for clear thinking and intentional action.",
      skillIds: ["focus", "energy", "engagement"]
    },
    {
      id: "stick_to_itiveness",
      name: "Stick-to-itiveness. Still here",
      icon: "🪝",
      hover: "Not chasing highs. Just not quitting.",
      skillIds: ["focus", "energy", "body_sync"]
    },
    {
      id: "physical_shape",
      name: "Physical Shape. Built presence",
      icon: "🔹",
      hover: "Self-image built through movement and consistency.",
      skillIds: ["body_sync"]
    },
    {
      id: "builder_mode",
      name: "Builder Mode. Acting with ownership",
      icon: "🚀",
      hover: "The mindset of making systems, not just tasks.",
      skillIds: ["business_insight", "execution_speed", "engagement"]
    },
    {
      id: "harmony",
      name: "Harmony. You're in the right place",
      icon: "🎼",
      hover: "What you're doing matches where your mind wants to be.",
      skillIds: ["business_insight", "energy", "focus"]
    },
    {
      id: "peace",
      name: "Peace",
      icon: "🌅",
      hover: "The baseline that lets everything work.",
      skillIds: ["focus", "energy", "engagement", "body_sync", "business_insight", "execution_speed", "relationship", "family", "community"]
    }
  ]
};
