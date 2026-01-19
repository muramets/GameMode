import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useScoreContext } from '../../../contexts/ScoreContext';
import { useTeamStore, useInviteStore } from '../../../stores/team';
import { usePersonalityStore } from '../../../stores/personalityStore';

interface InviteData {
    teamName: string;
    teamIcon?: string;
    teamColor?: string;
    roleName: string;
    roleIcon?: string;
    roleColor?: string;
    roleDescription?: string;
    teamId: string;
}

export function useJoinInviteLogic() {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { user, signInWithGoogle, loading: authLoading } = useAuth();
    const { getInviteInfo, joinTeam } = useInviteStore();
    const { memberships } = useTeamStore();
    const { switchPersonality } = usePersonalityStore();
    const { resetInitialized } = useScoreContext();

    // Initialize pendingJoin IMMEDIATELY from sessionStorage (critical for seamless reload)
    const [pendingJoin, setPendingJoin] = useState(() => {
        return sessionStorage.getItem(`pendingJoin_${code}`) === 'true';
    });

    // Cache invite data in sessionStorage to avoid re-fetch after auth
    const [inviteData, setInviteData] = useState<InviteData | null>(() => {
        const cached = sessionStorage.getItem(`inviteData_${code}`);
        return cached ? JSON.parse(cached) : null;
    });

    // Only show validation loading if we don't have cached data AND not pending
    const [isLoading, setIsLoading] = useState(!inviteData && !pendingJoin);
    const [isJoining, setIsJoining] = useState(false);
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isAlreadyMember = !!(inviteData && memberships[inviteData.teamId]);

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
                    teamColor: info.team.iconColor,
                    roleName: info.role.name,
                    roleIcon: info.role.icon,
                    roleColor: info.role.iconColor,
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

    // Auto-join after sign-in (for new users signing in via invite)
    useEffect(() => {
        if (user && pendingJoin && code && inviteData && !isAlreadyMember && !isJoining) {
            handleAutoJoin();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, pendingJoin, code, inviteData, isAlreadyMember, isJoining]);

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

    return {
        // State
        inviteData,
        isLoading,
        isJoining,
        isSigningIn,
        error,
        authLoading,
        isAlreadyMember,
        user,

        // Actions
        handleSignIn,
        handleJoin,
        navigate
    };
}
