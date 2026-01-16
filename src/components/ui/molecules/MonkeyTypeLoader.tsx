import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';

export const MonkeyTypeLoader = () => {
    return (
        <div className="flex flex-col items-center justify-center w-full py-12 animate-fade-in">
            <div className="text-[3em] text-sub">
                <FontAwesomeIcon icon={faCircleNotch} spin />
            </div>
        </div>
    );
};
