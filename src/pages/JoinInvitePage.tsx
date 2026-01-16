/**
 * JoinInvitePage
 * 
 * Public page for joining a team via invite link.
 * URL: /invite/:code
 * 
 * Flow:
 * 1. Validate invite code
 * 2. Show team/role preview
 * 3. If not logged in → Google Auth
 * 4. If logged in → Join team (copies template to personality)
 * 5. Redirect to dashboard with new personality active
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import { useTeamStore } from '../stores/teamStore';
import { usePersonalityStore } from '../stores/personalityStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationTriangle, faUsers, faCheck } from '@fortawesome/free-solid-svg-icons';
import { getMappedIcon } from '../utils/iconMapper';

export default function JoinInvitePage() {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { user, signInWithGoogle, loading: authLoading } = useAuth();
    const { getInviteInfo, joinTeam, memberships } = useTeamStore();
    const { switchPersonality } = usePersonalityStore();

    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inviteData, setInviteData] = useState<{
        teamName: string;
        teamIcon?: string;
        teamColor?: string;
        roleName: string;
        roleIcon?: string;
        roleColor?: string;
        roleDescription?: string;
        teamId: string;
    } | null>(null);

    // Check if already a member of this team
    const isAlreadyMember = inviteData && memberships[inviteData.teamId];

    // Validate invite on mount
    useEffect(() => {
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

                setInviteData({
                    teamName: info.team.name,
                    teamIcon: info.team.icon,
                    teamColor: info.team.themeColor,
                    roleName: info.role.name,
                    roleIcon: info.role.icon,
                    roleColor: info.role.themeColor,
                    roleDescription: info.role.description,
                    teamId: info.team.id
                });
            } catch {
                setError('Failed to validate invite');
            } finally {
                setIsLoading(false);
            }
        }

        validateInvite();
    }, [code, getInviteInfo]);

    const handleJoin = async () => {
        if (!user || !code) return;

        setIsJoining(true);
        setError(null);

        try {
            const personalityId = await joinTeam(user.uid, code);
            await switchPersonality(user.uid, personalityId);
            navigate('/');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to join team';
            setError(message);
            setIsJoining(false);
        }
    };

    const handleSignIn = async () => {
        try {
            await signInWithGoogle();
            // After sign in, user state will update and we can show join button
        } catch {
            setError('Failed to sign in');
        }
    };

    const teamIconDef = inviteData?.teamIcon ? getMappedIcon(inviteData.teamIcon) : null;
    const roleIconDef = inviteData?.roleIcon ? getMappedIcon(inviteData.roleIcon) : null;

    // Loading state
    if (isLoading || authLoading) {
        return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center">
                <div className="text-center">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-main text-3xl mb-4" />
                    <p className="text-sub">Validating invite...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !inviteData) {
        return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center">
                <div className="bg-card-bg rounded-2xl p-8 max-w-md text-center border border-border">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-error text-4xl mb-4" />
                    <h1 className="text-xl font-bold text-text-primary mb-2">Invalid Invite</h1>
                    <p className="text-sub mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-sub-alt text-text-primary rounded-lg hover:bg-sub transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Main invite preview
    return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
            <div className="bg-card-bg rounded-2xl p-8 max-w-md w-full border border-border shadow-xl">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-text-primary mb-1">You're Invited!</h1>
                    <p className="text-sub text-sm">Join a team and start your journey</p>
                </div>

                {/* Team & Role Preview */}
                {inviteData && (
                    <div className="bg-sub-alt rounded-xl p-5 mb-6">
                        <div className="flex items-center gap-4">
                            {/* Team Icon */}
                            <div
                                className="w-14 h-14 rounded-xl bg-bg-primary flex items-center justify-center shadow-md"
                                style={{ color: inviteData.teamColor || 'var(--main-color)' }}
                            >
                                {teamIconDef ? (
                                    <FontAwesomeIcon icon={teamIconDef} className="text-2xl" />
                                ) : (
                                    <FontAwesomeIcon icon={faUsers} className="text-2xl" />
                                )}
                            </div>

                            <div className="flex-1">
                                <h2 className="font-semibold text-text-primary text-lg">
                                    {inviteData.teamName}
                                </h2>
                                <div className="flex items-center gap-2 text-sm mt-1">
                                    <span className="text-sub">Role:</span>
                                    {roleIconDef && (
                                        <FontAwesomeIcon
                                            icon={roleIconDef}
                                            style={{ color: inviteData.roleColor }}
                                            className="text-xs"
                                        />
                                    )}
                                    <span style={{ color: inviteData.roleColor || 'var(--text-color)' }}>
                                        {inviteData.roleName}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {inviteData.roleDescription && (
                            <p className="text-sub text-sm mt-3 pt-3 border-t border-white/5">
                                {inviteData.roleDescription}
                            </p>
                        )}
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="bg-error/10 border border-error/20 rounded-lg p-3 mb-4 text-error text-sm flex items-center gap-2">
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Already member */}
                {isAlreadyMember && (
                    <div className="bg-main/10 border border-main/20 rounded-lg p-3 mb-4 text-main text-sm flex items-center gap-2">
                        <FontAwesomeIcon icon={faCheck} />
                        <span>You're already a member of this team!</span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    {!user ? (
                        <button
                            onClick={handleSignIn}
                            className="w-full py-3 bg-main text-bg-primary font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                            Sign in with Google to Join
                        </button>
                    ) : isAlreadyMember ? (
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-3 bg-main text-bg-primary font-bold rounded-xl hover:opacity-90 transition-opacity"
                        >
                            Go to Dashboard
                        </button>
                    ) : (
                        <button
                            onClick={handleJoin}
                            disabled={isJoining}
                            className="w-full py-3 bg-main text-bg-primary font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isJoining ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} spin />
                                    Joining...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faCheck} />
                                    Join Team
                                </>
                            )}
                        </button>
                    )}

                    <button
                        onClick={() => navigate('/login')}
                        className="text-sub text-sm hover:text-text-primary transition-colors"
                    >
                        {user ? 'Back to Login' : 'Cancel'}
                    </button>
                </div>
            </div>
        </div>
    );
}
