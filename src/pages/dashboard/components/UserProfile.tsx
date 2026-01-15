import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { Card } from '../../../components/ui/atoms/Card';
import { useAuth } from '../../../contexts/AuthProvider';
import { usePersonalityStore } from '../../../stores/personalityStore';
import { useScoreContext } from '../../../contexts/ScoreProvider';
import { getScoreColor } from '../../../utils/colorUtils';
import { isToday, isThisMonth, parseISO } from 'date-fns';

export function UserProfile() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { personalities, activePersonalityId } = usePersonalityStore();
    const { innerfaces, states, history } = useScoreContext();

    const activePersonality = personalities.find(p => p.id === activePersonalityId);
    const username = activePersonality?.name || user?.displayName || user?.email?.split('@')[0] || "Unknown Player";

    // 1. Level calculation: average of all innerfaces + states (on 10-point scale)
    const allScores = [
        ...innerfaces.map(i => i.currentScore || 0),
        ...states.map(s => s.score || 0)
    ];

    const averageScore = allScores.length > 0
        ? allScores.reduce((a, b) => a + b, 0) / allScores.length
        : 0;

    const level = Math.floor(averageScore) || 1;
    const percentage = (averageScore % 1) * 100;
    const progressColor = getScoreColor(averageScore);

    // 2. Check-ins today/month from history
    const stats = history.reduce((acc, record) => {
        const recordDate = parseISO(record.timestamp);
        // Consistent multiplier for visual XP based on protocol weight.
        const recordXP = Math.round(record.weight * 500);

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
            <span className={`text-xs font-mono ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{xp} XP{isTotal ? ' total' : ''}
            </span>
        );
    };

    return (
        <Card className="flex flex-col md:flex-row items-center justify-between gap-8 p-6 mb-8 bg-sub-alt rounded-lg shadow-sm border-none hover:scale-[1.02] hover:shadow-xl transition-all duration-300">
            {/* User Info Section */}
            <div className="flex md:flex-row items-center gap-4 w-full md:w-auto">
                {/* Avatar */}
                <div className="w-[66px] h-[66px] rounded-full bg-bg-primary flex items-center justify-center text-sub text-2xl shrink-0">
                    <FontAwesomeIcon icon={faUser} />
                </div>

                {/* Details */}
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <h2 className="text-[1.75rem] leading-none font-normal text-text-primary font-mono m-0 truncate cursor-default select-none">
                        {username}
                    </h2>

                    {/* Level + Progress Row */}
                    <div className="flex items-center gap-3 mt-4">
                        {/* Level Number */}
                        <span className="text-[2rem] font-medium font-mono text-text-primary leading-none">
                            {level}
                        </span>

                        {/* Progress Bar Container */}
                        <div className="flex items-center gap-2 w-full max-w-[300px]">
                            <div className="flex-1 h-[6px] bg-bg-primary rounded-[3px] overflow-hidden min-w-[100px]">
                                <div
                                    className="h-full transition-all duration-300 ease-out rounded-[3px]"
                                    style={{
                                        width: `${percentage}%`,
                                        backgroundColor: progressColor
                                    }}
                                />
                            </div>
                            {/* Decimal Value */}
                            <span className="text-xs text-sub text-right font-mono min-w-[4ch]">
                                {averageScore.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="hidden md:block w-1 h-[80px] bg-text-primary opacity-10 rounded-full ml-4"></div>
            </div>

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
