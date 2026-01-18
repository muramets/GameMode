import type { Team, TeamRole, TeamMembershipsMap, RoleMember } from '../../types/team';

export interface TeamBaseState {
    teams: Team[];
    roles: Record<string, TeamRole[]>;
    roleMembers: Record<string, RoleMember[]>;
    memberships: TeamMembershipsMap;
    isLoading: boolean;
    error: string | null;
}

// ============================================================================
// HELPER: Generate short invite code
// ============================================================================
export function generateInviteCode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
