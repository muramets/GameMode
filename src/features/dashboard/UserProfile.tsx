import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { Card } from '../../components/ui/Card';


interface UserProfileProps {
    username?: string;
    levelInfo?: {
        level: number;
        currentXP: number;
        maxXP: number;
        percentage: number;
        note?: string;
    };
    stats?: {
        checkinsToday: number;
        xpToday: number;
        checkinsMonth: number;
        xpMonth: number;
    };
}

export function UserProfile({
    username = "Unknown Player",
    levelInfo = { level: 1, currentXP: 0, maxXP: 100, percentage: 0, note: "Beginner" },
    stats = { checkinsToday: 0, xpToday: 0, checkinsMonth: 0, xpMonth: 0 }
}: UserProfileProps) {
    return (
        <Card className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 p-6 mb-8 bg-sub-alt rounded-lg shadow-sm border-none hover:scale-[1.02] transition-transform duration-300">
            {/* User Info Section */}
            <div className="flex md:flex-row items-center gap-4 w-full md:w-auto">
                {/* Avatar */}
                <div className="w-[66px] h-[66px] rounded-full bg-bg-primary flex items-center justify-center text-sub text-2xl shrink-0">
                    <FontAwesomeIcon icon={faUser} />
                </div>

                {/* Details */}
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <h2 className="text-[1.75rem] leading-none font-normal text-text-primary font-mono m-0 truncate">
                        {username}
                    </h2>

                    {/* Note / Level Label */}
                    <div className="flex justify-start">
                        <span className="text-xs text-sub px-2 py-1 bg-bg-primary rounded border border-[rgba(255,255,255,0.03)] opacity-80">
                            {levelInfo.note}
                        </span>
                    </div>

                    {/* Level + Progress Row */}
                    <div className="flex items-center gap-3 mt-1">
                        {/* Level Number */}
                        <span className="text-[2rem] font-medium font-mono text-text-primary leading-none">
                            {levelInfo.level}
                        </span>

                        {/* Progress Bar Container */}
                        <div className="flex items-center gap-2 w-full max-w-[300px]">
                            <div className="flex-1 h-[6px] bg-bg-primary rounded-[3px] overflow-hidden min-w-[100px]">
                                <div
                                    className="h-full bg-main transition-all duration-300 ease-out rounded-[3px]"
                                    style={{ width: `${levelInfo.percentage}%` }}
                                />
                            </div>
                            {/* Decimal Value */}
                            <span className="text-xs text-sub text-right font-mono min-w-[4ch]">
                                {(levelInfo.level + levelInfo.percentage / 100).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="hidden md:block w-2 h-[60px] bg-text-primary opacity-20 rounded-md ml-4"></div>
            </div>

            {/* Stats Section */}
            <div className="flex gap-8 mt-2 md:mt-0">
                <div className="flex flex-col items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:bg-[rgba(255,255,255,0.02)] group">
                    <span className="text-xs text-sub bg-bg-primary px-2 py-1 rounded border border-[rgba(255,255,255,0.03)] group-hover:bg-main group-hover:text-bg-primary group-hover:border-main transition-all duration-300">
                        Check-ins today
                    </span>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[1.5rem] font-medium font-mono text-text-primary leading-none">
                            {stats.checkinsToday}
                        </span>
                        <span className="text-xs text-sub font-mono">
                            (+{stats.xpToday} XP)
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:bg-[rgba(255,255,255,0.02)] group">
                    <span className="text-xs text-sub bg-bg-primary px-2 py-1 rounded border border-[rgba(255,255,255,0.03)] group-hover:bg-main group-hover:text-bg-primary group-hover:border-main transition-all duration-300">
                        Check-ins this month
                    </span>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[1.5rem] font-medium font-mono text-text-primary leading-none">
                            {stats.checkinsMonth}
                        </span>
                        <span className="text-xs text-sub font-mono">
                            (+{stats.xpMonth} XP total)
                        </span>
                    </div>
                </div>
            </div>
        </Card>
    );
}
