import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card } from '../../../components/ui/atoms/Card';
import { useAuth } from '../../../contexts/AuthProvider';
import { usePersonalityStore } from '../../../stores/personalityStore';
import { useTeamStore } from '../../../stores/teamStore';
import { useScoreContext } from '../../../contexts/ScoreProvider';
import { getTierColor } from '../../../utils/colorUtils';
import { calculateLevel, scoreToXP } from '../../../utils/xpUtils';
import { getMappedIcon } from '../../../utils/iconMapper';
import { isToday, isThisMonth, parseISO } from 'date-fns';

export function UserProfile() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { personalities, activePersonalityId, activeContext } = usePersonalityStore();
    const { roles } = useTeamStore();
    const { innerfaces, history } = useScoreContext();

    // Determine display data based on context (Role vs Personality)
    let displayName = "Unknown";
    let displayAvatar: string | undefined;
    let displayIcon: string = 'user';

    if (activeContext?.type === 'role') {
        const teamRoles = roles[activeContext.teamId] || [];
        const role = teamRoles.find(r => r.id === activeContext.roleId);
        displayName = role?.name || "Loading Role...";
        displayIcon = role?.icon || 'user';
    } else {
        const activePersonality = personalities.find(p => p.id === activePersonalityId);
        displayName = activePersonality?.name || user?.displayName || user?.email?.split('@')[0] || "Unknown Player";
        displayAvatar = activePersonality?.avatar;
        displayIcon = activePersonality?.icon || 'user';
    }

    // 1. Level calculation: Average of Innerfaces only (States are derivative, so excluding them avoids double counting)
    const allScores = [
        ...innerfaces.map(i => i.currentScore || 0)
    ];

    const averageScore = allScores.length > 0
        ? allScores.reduce((a, b) => a + b, 0) / allScores.length
        : 0;

    const totalXP = scoreToXP(averageScore);
    const { level, currentLevelXP, progress } = calculateLevel(totalXP);
    const tierColor = getTierColor(level);

    // 2. Check-ins today/month from history
    const stats = history.reduce((acc, record) => {
        // Exclude system events (re-linking, starting point changes, etc.) from daily/monthly stats
        if (record.type === 'system') return acc;

        const recordDate = parseISO(record.timestamp);
        // Use XP if available, else derive from weight
        const recordXP = record.xp ?? Math.round(record.weight * 100);

        if (isToday(recordDate)) {
            acc.checkinsToday += 1;
            acc.xpToday += recordXP;
        }
        if (isThisMonth(recordDate)) {
            acc.checkinsMonth += 1;
            acc.xpMonth += recordXP;
        }
        return acc;
    }, { checkinsToday: 0, xpToday: 0, checkinsMonth: 0, xpMonth: 0 });

    const handleNavigateToHistory = (timeFilter?: string) => {
        navigate('/history', { state: { filterTime: timeFilter } });
    };

    const renderXP = (xp: number, isTotal = false) => {
        if (xp === 0) return <span className="text-xs text-sub font-mono">0 XP</span>;
        const isPositive = xp > 0;
        return (
            <span
                className="text-xs font-mono"
                style={{ color: isPositive ? '#98c379' : '#ca4754' }}
            >
                {isPositive ? '+' : ''}{xp} XP{isTotal ? ' total' : ''}
            </span>
        );
    };

    // Calculate next TIER color (not just next level) for a visible motivational gradient
    // Tier boundaries: 1-3 (Red), 4-6 (Gold), 7-9 (Green), 10-19 (Purple), 20+ (Blue)
    const getNextTierFirstLevel = (currentLevel: number): number => {
        if (currentLevel <= 3) return 4;   // Next tier starts at level 4
        if (currentLevel <= 6) return 7;   // Next tier starts at level 7
        if (currentLevel <= 9) return 10;  // Next tier starts at level 10
        if (currentLevel <= 19) return 20; // Next tier starts at level 20
        return currentLevel + 1;           // Already at max tier, just use next level
    };
    const nextTierFirstLevel = getNextTierFirstLevel(level);
    const nextTierColor = getTierColor(nextTierFirstLevel);

    return (
        <Card className="group flex flex-col md:flex-row items-center justify-between gap-8 p-6 mb-8 bg-sub-alt rounded-lg shadow-sm border-none hover:scale-[1.02] hover:shadow-xl transition-all duration-300 overflow-hidden">
            {/* User Info Section */}
            <div className="flex md:flex-row items-center gap-4 w-full md:w-auto">
                {/* Avatar */}
                <div className="relative shrink-0 group/avatar">
                    {/* Premium Glow Effects */}
                    {displayAvatar && (
                        <>
                            <style>{`
                                @keyframes avatar-glow-spin {
                                    0% { transform: rotate(0deg) scale(1); }
                                    50% { transform: rotate(180deg) scale(1.05); }
                                    100% { transform: rotate(360deg) scale(1); }
                                }
                                @keyframes avatar-glow-counter {
                                    0% { transform: rotate(360deg) scale(1.05); }
                                    50% { transform: rotate(180deg) scale(1); }
                                    100% { transform: rotate(0deg) scale(1.05); }
                                }
                                @keyframes avatar-shimmer {
                                    0% { transform: translateX(-100%) rotate(25deg); opacity: 0; }
                                    5% { opacity: 1; }
                                    10% { transform: translateX(200%) rotate(25deg); opacity: 0; }
                                    100% { transform: translateX(200%) rotate(25deg); opacity: 0; }
                                }
                                @keyframes avatar-pulse {
                                    0%, 100% { transform: scale(1); }
                                    50% { transform: scale(1.02); }
                                }
                            `}</style>

                            {/* Outer Glow Layer (counter-rotation) */}
                            <div
                                className="absolute -inset-3 rounded-full blur-[20px] opacity-15 transition-opacity duration-150 group-hover:opacity-25"
                                style={{
                                    background: `conic-gradient(from 180deg, ${nextTierColor} 0%, ${tierColor} 50%, ${nextTierColor} 100%)`,
                                    animation: 'avatar-glow-counter 8s ease-in-out infinite'
                                }}
                            />

                            {/* Inner Glow Layer (main rotation) */}
                            <div
                                className="absolute -inset-1 rounded-full blur-[14px] opacity-25 transition-opacity duration-150 group-hover:opacity-40"
                                style={{
                                    background: `conic-gradient(from 0deg, ${tierColor} 0%, ${nextTierColor} 30%, ${tierColor} 50%, ${nextTierColor} 70%, ${tierColor} 100%)`,
                                    animation: 'avatar-glow-spin 6s ease-in-out infinite'
                                }}
                            />
                        </>
                    )}

                    {/* Avatar Container with Pulse */}
                    <div
                        className="w-[66px] h-[66px] rounded-full bg-bg-primary flex items-center justify-center text-sub text-2xl overflow-hidden relative shadow-sm border border-white/5 z-10 transition-transform duration-300 group-hover/avatar:scale-105"
                        style={{
                            animation: displayAvatar ? 'avatar-pulse 5s ease-in-out infinite' : 'none'
                        }}
                    >
                        {displayAvatar ? (
                            <img
                                src={displayAvatar}
                                alt={displayName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <FontAwesomeIcon icon={getMappedIcon(displayIcon)} />
                        )}
                    </div>
                </div>

                {/* Details */}
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <h2 className="text-[1.75rem] leading-none font-normal text-text-primary font-mono m-0 truncate cursor-default select-none">
                        {displayName}
                    </h2>

                    {/* Level + Progress Row */}
                    <div className="flex items-center gap-3 mt-4">
                        {/* Level Number */}
                        <div className="flex flex-col items-center leading-none">
                            <span
                                className="text-[2rem] font-medium font-mono"
                                style={{ color: tierColor }}
                            >
                                {level}
                            </span>
                            <span className="text-[9px] font-mono text-sub uppercase tracking-wider opacity-60 transition-all duration-300 group-hover:text-text-primary group-hover:opacity-100">Level</span>
                        </div>

                        {/* Progress Bar Container */}
                        <div className="flex flex-col gap-1.5 w-full max-w-[300px] min-w-[200px]">
                            <div className="w-full h-[6px] bg-bg-primary rounded-[3px] overflow-hidden">
                                <div
                                    className="h-full transition-all duration-300 ease-out rounded-[3px]"
                                    style={{
                                        width: `${progress}%`,
                                        backgroundColor: tierColor
                                    }}
                                />
                            </div>
                            {/* XP Progress Value */}
                            <div className="flex justify-between items-center text-[10px] font-mono text-sub leading-none w-full">
                                <span className="opacity-70 transition-all duration-300 group-hover:text-text-primary group-hover:opacity-100">
                                    {currentLevelXP} / 100 XP
                                </span>
                                <span className="opacity-50 transition-all duration-300 tracking-wide group-hover:text-text-primary group-hover:opacity-100">
                                    {totalXP} Total
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="hidden md:block w-[8px] h-[80px] bg-text-primary opacity-5 rounded-full ml-6 shrink-0 transition-all duration-300"></div>
            </div>

            {/* Mobile Separator (Horizontal) */}
            <div className="w-full h-[6px] bg-text-primary opacity-5 rounded-full my-6 md:hidden shrink-0"></div>

            {/* Stats Section */}
            <div className="flex gap-8 mt-2 md:mt-0">
                <div
                    onClick={() => handleNavigateToHistory('Today')}
                    className="flex flex-col items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:bg-[rgba(255,255,255,0.02)] group"
                >
                    <span className="text-xs text-sub bg-bg-primary px-2 py-1 rounded border border-[rgba(255,255,255,0.03)] group-hover:bg-main group-hover:text-bg-primary group-hover:border-main transition-all duration-300">
                        Check-ins today
                    </span>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[1.5rem] font-medium font-mono text-text-primary leading-none">
                            {stats.checkinsToday}
                        </span>
                        {renderXP(stats.xpToday)}
                    </div>
                </div>

                <div
                    onClick={() => handleNavigateToHistory('This month')}
                    className="flex flex-col items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:bg-[rgba(255,255,255,0.02)] group"
                >
                    <span className="text-xs text-sub bg-bg-primary px-2 py-1 rounded border border-[rgba(255,255,255,0.03)] group-hover:bg-main group-hover:text-bg-primary group-hover:border-main transition-all duration-300">
                        Check-ins this month
                    </span>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[1.5rem] font-medium font-mono text-text-primary leading-none">
                            {stats.checkinsMonth}
                        </span>
                        {renderXP(stats.xpMonth, true)}
                    </div>
                </div>
            </div>
        </Card>
    );
}
