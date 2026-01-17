/**
 * JoinInvitePage
 * 
 * Premium public page for joining a team via invite link.
 * URL: /invite/:code
 * 
 * Features:
 * - Animated background matching LoginPage
 * - Sleek team/role preview card
 * - Smooth transitions and hover states
 * - MonkeyType design language
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthProvider';
import { useScoreContext } from '../contexts/ScoreProvider';
import { useTeamStore } from '../stores/teamStore';
import { usePersonalityStore } from '../stores/personalityStore';
import { Button } from '../components/ui/atoms/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSpinner,
    faExclamationTriangle,
    faUsers,
    faCheck,
    faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import { GlobalLoader } from '../components/ui/molecules/GlobalLoader';
import { getMappedIcon } from '../utils/iconMapper';

// Google icon as SVG
function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}



export default function JoinInvitePage() {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { user, signInWithGoogle, loading: authLoading } = useAuth();
    const { getInviteInfo, joinTeam, memberships } = useTeamStore();
    const { switchPersonality } = usePersonalityStore();
    const { resetInitialized } = useScoreContext();

    // Initialize pendingJoin IMMEDIATELY from sessionStorage (critical for seamless reload)
    const [pendingJoin, setPendingJoin] = useState(() => {
        return sessionStorage.getItem(`pendingJoin_${code}`) === 'true';
    });

    // Cache invite data in sessionStorage to avoid re-fetch after auth
    const [inviteData, setInviteData] = useState<{
        teamName: string;
        teamIcon?: string;
        teamColor?: string;
        roleName: string;
        roleIcon?: string;
        roleColor?: string;
        roleDescription?: string;
        teamId: string;
    } | null>(() => {
        const cached = sessionStorage.getItem(`inviteData_${code}`);
        return cached ? JSON.parse(cached) : null;
    });

    // Only show validation loading if we don't have cached data AND not pending
    const [isLoading, setIsLoading] = useState(!inviteData && !pendingJoin);
    const [isJoining, setIsJoining] = useState(false);
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isAlreadyMember = inviteData && memberships[inviteData.teamId];

    // Validate invite on mount (skip if returning from auth with cached data)
    useEffect(() => {
        // Skip validation if we already have data or are in pending join state
        if (inviteData || pendingJoin) {
            setIsLoading(false);
            return;
        }

        async function validateInvite() {
            if (!code) {
                setError('No invite code provided');
                setIsLoading(false);
                return;
            }

            try {
                const info = await getInviteInfo(code);
                if (!info) {
                    setError('Invalid or expired invite code');
                    setIsLoading(false);
                    return;
                }

                const data = {
                    teamName: info.team.name,
                    teamIcon: info.team.icon,
                    teamColor: info.team.themeColor,
                    roleName: info.role.name,
                    roleIcon: info.role.icon,
                    roleColor: info.role.themeColor,
                    roleDescription: info.role.description,
                    teamId: info.team.id
                };

                setInviteData(data);
                // Cache for after auth
                sessionStorage.setItem(`inviteData_${code}`, JSON.stringify(data));
            } catch {
                setError('Failed to validate invite');
            } finally {
                setIsLoading(false);
            }
        }

        validateInvite();
    }, [code, getInviteInfo, inviteData, pendingJoin]);

    // Auto-join after sign-in (for new users signing in via invite)
    useEffect(() => {
        if (user && pendingJoin && code && inviteData && !isAlreadyMember && !isJoining) {
            handleAutoJoin();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, pendingJoin, code, inviteData, isAlreadyMember, isJoining]);

    const handleAutoJoin = async () => {
        if (!user || !code) return;

        // Reset initialization state to start fresh loading cycle
        resetInitialized();

        // Signal global loading first to reset progress bar
        useTeamStore.getState().setLoading(true);

        // Delay local state to ensure GlobalLoader mounts AFTER ScoreProvider reset
        setTimeout(() => {
            setIsJoining(true);
            setError(null);
        }, 10);

        try {
            const personalityId = await joinTeam(user.uid, code);
            await switchPersonality(user.uid, personalityId);

            // Clean up session storage
            sessionStorage.removeItem(`pendingJoin_${code}`);
            sessionStorage.removeItem(`inviteData_${code}`);

            navigate('/');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to join team';
            setError(message);
            setPendingJoin(false);
            setIsJoining(false);
            sessionStorage.removeItem(`pendingJoin_${code}`);
        }
    };

    const handleJoin = async () => {
        if (!user || !code) return;

        // Reset initialization state to start fresh loading cycle
        resetInitialized();

        // Signal global loading first to reset progress bar
        useTeamStore.getState().setLoading(true);

        // Delay local state to ensure GlobalLoader mounts AFTER ScoreProvider reset
        setTimeout(() => {
            setIsJoining(true);
            setError(null);
        }, 10);

        try {
            const personalityId = await joinTeam(user.uid, code);
            await switchPersonality(user.uid, personalityId);

            // Clean up
            sessionStorage.removeItem(`inviteData_${code}`);

            navigate('/');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to join team';
            setError(message);
            setIsJoining(false);
        }
    };

    const handleSignIn = async () => {
        setIsSigningIn(true);
        try {
            setPendingJoin(true);
            sessionStorage.setItem(`pendingJoin_${code}`, 'true');
            await signInWithGoogle();
            // Don't navigate here - let auto-join useEffect handle it
        } catch {
            setError('Failed to sign in');
            setIsSigningIn(false);
            setPendingJoin(false);
            sessionStorage.removeItem(`pendingJoin_${code}`);
        }
    };

    const teamIconDef = inviteData?.teamIcon ? getMappedIcon(inviteData.teamIcon) : null;
    const roleIconDef = inviteData?.roleIcon ? getMappedIcon(inviteData.roleIcon) : null;

    // Loading state (Initial validation only)
    if (isLoading) {
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

    // Auth, Pending Join, or Joining state
    // Show minimal bg so GlobalLoader is the only visible indicator
    if (authLoading || isJoining) {
        return <GlobalLoader />;
    }

    // Error state (no invite data)
    if (error && !inviteData) {
        return (
            <div
                className="relative min-h-screen flex items-center justify-center font-mono px-4"
                style={{ backgroundColor: 'var(--bg-color)' }}
            >

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center relative z-10 max-w-md"
                >
                    <div
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
                        style={{ backgroundColor: 'var(--sub-alt-color)' }}
                    >
                        <FontAwesomeIcon
                            icon={faExclamationTriangle}
                            className="text-2xl"
                            style={{ color: 'var(--error-color)' }}
                        />
                    </div>
                    <h1
                        className="text-2xl font-bold mb-2 lowercase"
                        style={{ color: 'var(--text-color)' }}
                    >
                        invalid invite
                    </h1>
                    <p className="mb-8 lowercase" style={{ color: 'var(--sub-color)' }}>
                        {error.toLowerCase()}
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium lowercase transition-all duration-200"
                        style={{
                            backgroundColor: 'var(--sub-alt-color)',
                            color: 'var(--text-color)',
                        }}
                    >
                        go to dashboard
                        <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                    </button>
                </motion.div>
            </div>
        );
    }

    // Main invite preview
    return (
        <div
            className="relative min-h-screen flex items-center justify-center font-mono px-4 cursor-default select-none"
            style={{ backgroundColor: 'var(--bg-color)' }}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md bg-[var(--sub-alt-color)] rounded-3xl p-8 hover:shadow-2xl transition-shadow duration-300 shadow-xl"
            >
                {/* Header - No Icon, just text */}
                <div className="text-center mb-8">
                    <h1
                        className="text-3xl font-bold mb-2 lowercase tracking-tight"
                        style={{ color: 'var(--text-color)' }}
                    >
                        you're invited!
                    </h1>
                    <p className="text-base lowercase" style={{ color: 'var(--sub-color)' }}>
                        join a team and start your journey
                    </p>
                </div>

                {/* Team & Role Preview Card */}
                {inviteData && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                        whileHover={{
                            scale: 1.02,
                            backgroundColor: 'rgba(0,0,0,0.15)',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                        }}
                        transition={{ duration: 0.2 }}
                        className="rounded-2xl p-5 mb-8"
                        style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                    >
                        <div className="flex items-center gap-4">
                            {/* Team Icon - StateCard Frozen Blur Style */}
                            <div
                                className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                                style={{
                                    backgroundColor: `${inviteData.teamColor || '#ffffff'}33`,
                                    color: inviteData.teamColor || 'var(--main-color)',
                                    boxShadow: `0 0 15px ${inviteData.teamColor || '#ffffff'}15`
                                }}
                            >
                                {teamIconDef ? (
                                    <FontAwesomeIcon icon={teamIconDef} className="text-2xl" />
                                ) : (
                                    <FontAwesomeIcon icon={faUsers} className="text-2xl" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h2
                                    className="font-bold text-lg truncate"
                                    style={{ color: 'var(--text-color)' }}
                                >
                                    {inviteData.teamName}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm" style={{ color: 'var(--sub-color)' }}>
                                        role:
                                    </span>
                                    {roleIconDef && (
                                        <FontAwesomeIcon
                                            icon={roleIconDef}
                                            style={{ color: inviteData.roleColor }}
                                            className="text-xs"
                                        />
                                    )}
                                    <span
                                        className="text-sm lowercase font-medium"
                                        style={{ color: inviteData.roleColor || 'var(--text-color)' }}
                                    >
                                        {inviteData.roleName}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {inviteData.roleDescription && (
                            <p
                                className="text-sm mt-4 pt-4 lowercase leading-relaxed"
                                style={{
                                    color: 'var(--sub-color)',
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                }}
                            >
                                {inviteData.roleDescription}
                            </p>
                        )}
                    </motion.div>
                )}

                {/* Error message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-2 px-4 py-3 rounded-lg mb-6 text-sm w-full break-all text-left"
                            style={{
                                backgroundColor: 'rgba(var(--error-color-rgb, 202, 71, 84), 0.1)',
                                color: 'var(--error-color)',
                            }}
                        >
                            <FontAwesomeIcon icon={faExclamationTriangle} className="shrink-0" />
                            <span className="lowercase">{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Already member */}
                <AnimatePresence>
                    {isAlreadyMember && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-2 px-4 py-3 rounded-lg mb-6 text-sm"
                            style={{
                                backgroundColor: 'rgba(var(--main-color-rgb, 230, 183, 100), 0.1)',
                                color: 'var(--main-color)',
                            }}
                        >
                            <FontAwesomeIcon icon={faCheck} />
                            <span className="lowercase">you're already a member of this team!</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Actions with Button Atom */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col gap-3"
                >
                    {!user ? (
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleSignIn}
                            isLoading={isSigningIn}
                            leftIcon={!isSigningIn ? <GoogleIcon /> : undefined}
                            className="w-full lowercase h-12 text-base"
                        >
                            {isSigningIn ? 'signing in...' : 'sign in with google to join'}
                        </Button>
                    ) : isAlreadyMember ? (
                        <Button
                            variant="primary"
                            size="lg" // Primary because it's the main action "Go to Dashboard"
                            onClick={() => navigate('/')}
                            rightIcon={<FontAwesomeIcon icon={faArrowRight} />}
                            className="w-full lowercase h-12 text-base"
                        >
                            go to dashboard
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleJoin}
                            isLoading={isJoining}
                            leftIcon={!isJoining ? <FontAwesomeIcon icon={faCheck} /> : undefined}
                            className="w-full lowercase h-12 text-base"
                        >
                            {isJoining ? 'joining...' : 'join team'}
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="md"
                        onClick={() => navigate(user ? '/' : '/login')}
                        className="w-full lowercase"
                    >
                        {user ? 'back to dashboard' : 'cancel'}
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}
