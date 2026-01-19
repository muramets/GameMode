import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getIcon } from '../../../config/iconRegistry';

interface AppIconProps {
    id: string;
    className?: string;
}

/**
 * Application icon component that renders icons from the registry.
 * Use this instead of direct FontAwesomeIcon for app-defined icons.
 */
export function AppIcon({ id, className }: AppIconProps) {
    return <FontAwesomeIcon icon={getIcon(id)} className={className} />;
}
