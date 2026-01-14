import { Card } from '../../../components/ui/atoms/Card';
import type { Innerface } from '../../../pages/protocols/types';

import { renderIcon } from '../../../utils/iconMapper';

interface InnerfaceCardProps {
    innerface: Innerface;
}

export function InnerfaceCard({ innerface }: InnerfaceCardProps) {
    const score = innerface.currentScore || innerface.initialScore;
    const progress = (score / 10) * 100;

    return (
        <Card className="p-4 hover:translate-y-[-2px] transition-all duration-300 group overflow-hidden relative">
            {/* Background accent */}
            <div
                className="absolute top-0 right-0 w-24 h-24 opacity-[0.03] transition-opacity group-hover:opacity-[0.05]"
                style={{
                    background: `radial-gradient(circle at top right, ${innerface.color || '#e2b714'}, transparent)`
                }}
            />

            <div className="flex items-start justify-between mb-3 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-black/20 text-xl shadow-inner shrink-0 group-hover:bg-black/30 transition-colors duration-300">
                        {renderIcon(innerface.icon)}
                    </div>
                    <div>
                        <h3 className="text-text-primary font-medium text-sm leading-tight">
                            {innerface.name.split('.')[0]}
                        </h3>
                        {innerface.name.split('.')[1] && (
                            <p className="text-sub text-[10px] font-mono mt-0.5">
                                {innerface.name.split('.')[1].trim()}
                            </p>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-mono font-bold leading-none" style={{ color: innerface.color }}>
                        {score.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Score Bar */}
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-2 relative z-10">
                <div
                    className="h-full transition-all duration-500 ease-out rounded-full"
                    style={{
                        width: `${Math.min(100, progress)}%`,
                        backgroundColor: innerface.color || '#e2b714',
                        boxShadow: `0 0 10px ${innerface.color || '#e2b714'}40`
                    }}
                />
            </div>

            {innerface.hover && (
                <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-sub text-[10px] leading-relaxed italic">
                        "{innerface.hover}"
                    </p>
                </div>
            )}
        </Card>
    );
}
