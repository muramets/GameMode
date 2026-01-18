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

import { GlobalLoader } from '../components/ui/molecules/GlobalLoader';
import { useJoinInviteLogic } from '../features/teams/hooks/useJoinInviteLogic';
import { InviteLoadingState } from '../features/teams/components/JoinInvite/InviteLoadingState';
import { InviteErrorState } from '../features/teams/components/JoinInvite/InviteErrorState';
import { InviteJoinCard } from '../features/teams/components/JoinInvite/InviteJoinCard';

export default function JoinInvitePage() {
    const {
        inviteData,
        isLoading,
        isJoining,
        isSigningIn,
        error,
        authLoading,
        isAlreadyMember,
        user,
        handleSignIn,
        handleJoin,
        navigate
    } = useJoinInviteLogic();

    // Loading state (Initial validation only)
    if (isLoading) {
        return <InviteLoadingState />;
    }

    // Auth, Pending Join, or Joining state
    // Show minimal bg so GlobalLoader is the only visible indicator
    if (authLoading || isJoining) {
        return <GlobalLoader />;
    }

    // Error state (no invite data)
    if (error && !inviteData) {
        return <InviteErrorState error={error} />;
    }

    // Main invite preview
    return (
        <InviteJoinCard
            inviteData={inviteData}
            error={error}
            user={user}
            isAlreadyMember={isAlreadyMember}
            isSigningIn={isSigningIn}
            isJoining={isJoining}
            onSignIn={handleSignIn}
            onJoin={handleJoin}
            onNavigateHome={() => navigate('/')}
            onNavigateLogin={() => navigate(user ? '/' : '/login')}
        />
    );
}
