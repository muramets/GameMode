import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';

interface MemberItemProps {
    member: {
        uid: string;
        personalityId: string;
        displayName: string
    };
    onClick: () => void;
}

export const MemberItem = ({ member, onClick }: MemberItemProps) => {
    return (
        <div
            onClick={onClick}
            className="group/member flex items-center cursor-pointer transition-colors duration-100 leading-none text-[var(--sub-color)] hover:text-[var(--bg-color)] hover:bg-[var(--text-color)]"
            style={{ padding: '0.35em 0', paddingLeft: '4em' }}
        >
            {/* Member Icon */}
            <div
                className="w-[1em] h-[1em] flex items-center justify-center shrink-0 opacity-60 group-hover/member:opacity-100"
                style={{ marginRight: '0.6em' }}
            >
                <FontAwesomeIcon icon={faEye} className="text-[0.8em]" />
            </div>

            {/* Member Name */}
            <div className="flex-1 truncate text-[0.85em] opacity-80 group-hover/member:opacity-100 transition-opacity">
                {member.displayName.toLowerCase()}
            </div>
        </div>
    );
};
