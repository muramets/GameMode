/**
 * Team Types
 * 
 * Defines the data structures for the Teams feature.
 * Teams allow admins (producers) to create role templates that get copied
 * to users' personalities when they join via invite link.
 */

import type { Protocol } from '../features/protocols/types';
import type { Innerface } from '../features/innerfaces/types';
import type { StateData } from '../features/dashboard/types';

// ============================================================================
// CORE ENTITIES
// ============================================================================

/**
 * Team - A workspace containing roles managed by an owner (producer).
 * Stored in: teams/{teamId}
 */
export interface Team {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    iconColor?: string;
    ownerId: string;          // uid of the creator/admin
    memberUids: string[];     // uids of all members (for queries)
    createdAt: number;
}

/**
 * TeamRole - A role template inside a team.
 * When a user joins, this template is copied to their personalities.
 * Stored in: teams/{teamId}/roles/{roleId}
 */
export interface TeamRole {
    id: string;
    teamId: string;
    name: string;
    description?: string;
    icon?: string;
    iconColor?: string;
    currentTheme?: string; // Active theme name (e.g. 'serika_dark')
    favThemes?: string[];  // Favorite theme names
    createdAt: number;
    activeInviteCode?: string; // Cache persistent invite link
    templateData: RoleTemplate;
}

/**
 * RoleTemplate - The actual game data that gets copied to user's personality.
 */
export interface RoleTemplate {
    innerfaces: Innerface[];
    protocols: Protocol[];
    states: StateData[];
    groups: Record<string, { icon: string; color?: string }>;
    groupOrder: string[];
    innerfaceGroupOrder: string[];
    pinnedProtocolIds: string[];
}

// ============================================================================
// INVITES & SHARING
// ============================================================================

/**
 * TeamInvite - An invite link that allows users to join a team with a specific role.
 * Stored in: team_invites/{inviteCode}
 */
export interface TeamInvite {
    code: string;             // 8-character short code
    teamId: string;
    roleId: string;
    createdBy: string;        // uid of admin who created the invite
    createdAt: number;
    expiresAt?: number;       // optional expiration timestamp
    singleUse: boolean;       // if true, invalidate after first use
    used?: boolean;           // for single-use invites
}

/**
 * RoleShare - Allows a user to share their personal personality with an admin.
 * This enables producers to view progress of users who created their own roles.
 * Stored in: role_shares/{shareId}
 */
export interface RoleShare {
    id: string;
    fromUserId: string;       // user sharing their personality
    toUserId: string;         // admin receiving access
    personalityId: string;    // the personality being shared
    teamId?: string;          // optional: if associated with a team
    createdAt: number;
    status: 'pending' | 'accepted' | 'declined';
}

// ============================================================================
// USER MEMBERSHIP
// ============================================================================

/**
 * TeamMembership - Tracks a user's membership in a team.
 * Stored in: users/{uid} document under teamMemberships field.
 */
export interface TeamMembership {
    teamId: string;
    roleId: string;
    personalityId: string;    // ID of the copied personality in user's account
    joinedAt: number;
    invitedBy: string;        // uid of admin who created the invite
}

/**
 * TeamMemberships map stored on user document.
 */
export type TeamMembershipsMap = Record<string, TeamMembership>;

// ============================================================================
// ROLE MEMBERS (for admin viewing)
// ============================================================================

/**
 * RoleMember - Cached info about a user who joined via role invite.
 * Used for displaying members in TeamsDropdown and enabling viewer mode.
 * Stored in: teams/{teamId}/roles/{roleId}/members/{uid}
 */
export interface RoleMember {
    uid: string;
    displayName: string;      // cached user display name
    icon?: string;            // avatar/icon for display
    personalityId: string;    // ID of personality for viewer mode
    joinedAt: number;
    lastActiveAt?: number;    // for sorting by activity
}

// ============================================================================
// COACH NOTES (future feature preparation)
// ============================================================================

/**
 * CoachNote - Notes/comments from admin about a participant's progress.
 * Stored in: teams/{teamId}/roles/{roleId}/members/{uid}/notes/{noteId}
 * 
 * @future This is a prepared structure for future implementation.
 */
export interface CoachNote {
    id: string;
    authorId: string;         // admin who wrote the note
    content: string;
    createdAt: number;
    updatedAt?: number;
    // Future: could add tags, visibility, linked protocols, etc.
}
