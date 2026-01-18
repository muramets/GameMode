import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

export function InviteLoadingState() {
    return (
        <div
            className="relative min-h-screen flex items-center justify-center font-mono"
            style={{ backgroundColor: 'var(--bg-color)' }}
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center relative z-10"
            >
                <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    className="text-3xl mb-4"
                    style={{ color: 'var(--main-color)' }}
                />
                <p className="lowercase" style={{ color: 'var(--sub-color)' }}>
                    validating invite...
                </p>
            </motion.div>
        </div>
    );
}
