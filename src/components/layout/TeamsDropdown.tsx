/**
 * TeamsDropdown Component
 * 
 * A dropdown menu for managing teams and roles, positioned to the left
 * of the PersonalityDropdown in the header. Provides:
 * - List of teams user owns or is a member of
 * - Collapsible roles under each team
 * - Quick actions: create team, create role, settings
 * - Join with invite link option
 * 
 * UI follows MonkeyType dropdown styling for consistency.
 */

import React, { useState, useEffect } from 'react';
import { useTeamStore } from '../../stores/teamStore';
import { usePersonalityStore } from '../../stores/personalityStore';
import { useAuth } from '../../contexts/AuthProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUsers,
    faPlus,
    faChevronDown,
    faChevronRight,
    faCog,
    faCheck,
    faLink,
    faEye
} from '@fortawesome/free-solid-svg-icons';
import { getMappedIcon } from '../../utils/iconMapper';
import { TeamSettingsModal } from '../modals/TeamSettingsModal';
import { RoleSettingsModal } from '../modals/RoleSettingsModal';
import { JoinTeamModal } from '../modals/JoinTeamModal';
import { ADMIN_EMAILS } from '../../config/adminList';

export function TeamsDropdown() {
    const { user } = useAuth();
    const { teams, roles, roleMembers, subscribeToTeams, loadRoles, subscribeToRoleMembers } = useTeamStore();
    const { switchToRole, switchToViewer, activeContext } = usePersonalityStore();

    // Local state
    const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
    const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
    const [hoveredArrowRole, setHoveredArrowRole] = useState<string | null>(null);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
    const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
    const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

    // Subscribe to teams on mount
    useEffect(() => {
        if (!user?.uid) return;
        const unsub = subscribeToTeams(user.uid);
        return unsub;
    }, [user?.uid, subscribeToTeams]);

    // Admin Access Control: Only listed admins can see the Teams Dropdown
    const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

    // Filter teams to only show those owned by the user
    // Participants (members) should not see teams in this menu to avoid confusion
    const ownedTeams = teams.filter(t => t.ownerId === user?.uid);

    // Load roles for each team
    useEffect(() => {
        ownedTeams.forEach(team => {
            if (!roles[team.id]) {
                loadRoles(team.id);
            }
        });
    }, [ownedTeams, roles, loadRoles]);

    // Eager load: Subscribe to members for ALL roles (realtime)
    useEffect(() => {
        const unsubscribes: (() => void)[] = [];

        ownedTeams.forEach(team => {
            const teamRoles = roles[team.id] || [];
            teamRoles.forEach(role => {
                const unsub = subscribeToRoleMembers(team.id, role.id);
                unsubscribes.push(unsub);
            });
        });

        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
    }, [ownedTeams, roles, subscribeToRoleMembers]);

    // Check active role highlight
    const getActiveTeamRole = () => {
        // 1. If in Design Mode (Role Context)
        if (activeContext?.type === 'role') {
            return { teamId: activeContext.teamId, roleId: activeContext.roleId };
        }
        return null;
    };

    const activeTeamRole = getActiveTeamRole();

    // If not admin, do not render anything
    if (!isAdmin) return null;

    const toggleTeamExpand = (teamId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedTeams(prev => {
            const next = new Set(prev);
            if (next.has(teamId)) {
                next.delete(teamId);
            } else {
                next.add(teamId);
            }
            return next;
        });
    };

    const toggleRoleExpand = (teamId: string, roleId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const key = `${teamId}/${roleId}`;
        setExpandedRoles(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const handleMemberClick = (member: { uid: string; personalityId: string; displayName: string }, teamId: string, roleId: string) => {
        switchToViewer(member.uid, member.personalityId, teamId, roleId, member.displayName);
    };

    const handleRoleClick = (teamId: string, roleId: string) => {
        // Always owner here because we filtered
        switchToRole(teamId, roleId);
    };

    const handleEditTeam = (e: React.MouseEvent, teamId: string) => {
        e.stopPropagation();
        setEditingTeamId(teamId);
        setIsTeamModalOpen(true);
    };

    const handleCreateTeam = () => {
        setEditingTeamId(null);
        setIsTeamModalOpen(true);
    };

    const handleCreateRole = (e: React.MouseEvent, teamId: string) => {
        e.stopPropagation();
        setActiveTeamId(teamId);
        setEditingRoleId(null);
        setIsRoleModalOpen(true);
    };

    const handleEditRole = (e: React.MouseEvent, teamId: string, roleId: string) => {
        e.stopPropagation();
        setActiveTeamId(teamId);
        setEditingRoleId(roleId);
        setIsRoleModalOpen(true);
    };

    return (
        <>
            <div className="relative group z-50 font-mono lowercase">
                {/* Trigger Button */}
                <button
                    className="grid grid-flow-col items-center gap-[0.33em] outline-none leading-none transition-colors duration-150 text-[1rem]"
                    style={{ color: 'var(--sub-color)' }}
                >
                    <div
                        className="flex items-center justify-center transition-colors duration-150 group-hover:text-[var(--text-color)]"
                        style={{ width: '1.4em', height: '1.4em' }}
                    >
                        <FontAwesomeIcon icon={faUsers} style={{ fontSize: '1em' }} />
                    </div>

                    <span
                        className="mt-[0.1em] transition-colors duration-150 group-hover:text-[var(--text-color)] max-[850px]:hidden"
                        style={{ fontSize: '0.75em' }}
                    >
                        teams
                    </span>

                    {/* Team Count Badge */}
                    <div
                        className="flex items-center justify-center transition-colors duration-150 bg-[var(--sub-color)] group-hover:bg-[var(--text-color)] group-hover:text-[var(--bg-color)]"
                        style={{
                            fontSize: '0.65em',
                            lineHeight: '0.65em',
                            padding: '0.3em 0.45em',
                            borderRadius: '4px',
                            color: 'var(--bg-color)',
                            alignSelf: 'center',
                            width: 'max-content'
                        }}
                    >
                        {ownedTeams.length}
                    </div>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 min-w-[26ch] z-[100] text-[0.75rem] pt-2">
                    <div
                        className="flex flex-col rounded-[0.5rem] overflow-hidden"
                        style={{
                            backgroundColor: 'var(--sub-alt-color)',
                            boxShadow: '0 0 0 0.5em var(--bg-color)',
                            // gap: '0.25em' // Removed gap to fix hover highlighting
                        }}
                    >
                        {/* Teams List */}
                        {ownedTeams.length === 0 ? (
                            <div
                                className="flex items-center justify-center leading-none opacity-50"
                                style={{ color: 'var(--sub-color)', padding: '0.5em 0' }}
                            >
                                no teams yet
                            </div>
                        ) : (
                            ownedTeams.map((team, index) => {
                                const isExpanded = expandedTeams.has(team.id);
                                const teamRoles = roles[team.id] || [];
                                const iconDef = getMappedIcon(team.icon || 'users') || getMappedIcon('users');

                                return (
                                    <div key={team.id}>
                                        {/* Team Header */}
                                        <div
                                            onClick={(e) => toggleTeamExpand(team.id, e)}
                                            className={`
                                                group/item relative flex items-center justify-start text-left cursor-pointer 
                                                transition-colors duration-100 leading-none select-none
                                                text-[var(--sub-color)] hover:text-[var(--text-color)]
                                                ${index === 0 ? 'mt-1 mb-1' : 'mt-2 mb-2 border-t border-[var(--bg-color)] pt-3 pb-3'}
                                            `}
                                            style={{ padding: '0.25em 0 0.25em 0' }}
                                        >
                                            {/* Expand Arrow */}
                                            <div
                                                className="w-[1em] flex items-center justify-center shrink-0 opacity-60"
                                                style={{ marginLeft: '0.5em', marginRight: '0.3em' }}
                                            >
                                                <FontAwesomeIcon
                                                    icon={isExpanded ? faChevronDown : faChevronRight}
                                                    className="text-[0.6em]"
                                                />
                                            </div>

                                            {/* Team Icon */}
                                            <div
                                                className="w-[1em] h-[1em] flex items-center justify-center shrink-0 transition-colors opacity-80 group-hover/item:opacity-100"
                                                style={{
                                                    color: team.themeColor || 'inherit',
                                                    marginRight: '0.7em'
                                                }}
                                            >
                                                {iconDef ? (
                                                    <FontAwesomeIcon icon={iconDef} className="text-[1em]" />
                                                ) : (
                                                    <span className="text-[1em] leading-none">{team.icon || '🏢'}</span>
                                                )}
                                            </div>

                                            {/* Team Name */}
                                            <div className="flex-1 truncate pt-[0.1em] mr-2 opacity-80 group-hover/item:opacity-100 transition-opacity">
                                                {team.name.toLowerCase()}
                                            </div>

                                            {/* Settings (owner only - always true here) */}
                                            <div className="flex items-center shrink-0 mr-[0.9em]">
                                                <button
                                                    onClick={(e) => handleEditTeam(e, team.id)}
                                                    className="opacity-0 group-hover/item:opacity-100 transition-all text-[var(--text-color)]"
                                                >
                                                    <FontAwesomeIcon icon={faCog} className="text-[0.8em]" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Minimal separator before roles */}
                                        {teamRoles.length > 0 && (
                                            <div className="flex justify-center mb-1">
                                                <div
                                                    className="h-[1px] w-32 opacity-20"
                                                    style={{ backgroundColor: 'var(--sub-color)' }}
                                                />
                                            </div>
                                        )}

                                        {/* Roles (expanded) */}
                                        {isExpanded && (
                                            <div className="flex flex-col">
                                                {teamRoles.map(role => {
                                                    const isActive = activeTeamRole?.teamId === team.id && activeTeamRole?.roleId === role.id;
                                                    const roleIconDef = getMappedIcon(role.icon || 'user');
                                                    const memberKey = `${team.id}/${role.id}`;
                                                    const members = roleMembers[memberKey] || [];
                                                    const isRoleExpanded = expandedRoles.has(memberKey);
                                                    const hasMembers = members.length > 0;
                                                    const isArrowHovered = hoveredArrowRole === role.id;

                                                    return (
                                                        <div key={role.id}>
                                                            {/* Role Row Container */}
                                                            <div className="flex items-center">
                                                                {/* Expand Arrow - separate hover target */}
                                                                <div
                                                                    className={`w-[1.5em] h-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${hasMembers
                                                                        ? `text-[var(--sub-color)] hover:text-[var(--text-color)] ${isArrowHovered ? 'text-[var(--text-color)] opacity-100' : 'opacity-60 hover:opacity-100'}`
                                                                        : 'opacity-0 pointer-events-none'
                                                                        }`}
                                                                    style={{ marginLeft: '0.5em' }}
                                                                    onClick={(e) => hasMembers && toggleRoleExpand(team.id, role.id, e)}
                                                                    onMouseEnter={() => setHoveredArrowRole(role.id)}
                                                                    onMouseLeave={() => setHoveredArrowRole(null)}
                                                                >
                                                                    {hasMembers && (
                                                                        <FontAwesomeIcon
                                                                            icon={isRoleExpanded ? faChevronDown : faChevronRight}
                                                                            className="text-[0.5em]"
                                                                        />
                                                                    )}
                                                                </div>

                                                                {/* Role Row - nav item styling */}
                                                                <div
                                                                    onClick={() => handleRoleClick(team.id, role.id)}
                                                                    className="group/role flex-1 flex items-center cursor-pointer transition-colors duration-100 leading-none select-none text-[var(--text-color)] hover:text-[var(--bg-color)] hover:bg-[var(--text-color)]"
                                                                    style={{ padding: '0.4em 0.8em 0.4em 0.3em' }}
                                                                >
                                                                    {/* Role Icon */}
                                                                    <div
                                                                        className={`w-[1em] h-[1em] flex items-center justify-center shrink-0 opacity-70 group-hover/role:opacity-100 ${role.themeColor ? 'group-hover/role:!text-inherit' : ''}`}
                                                                        style={{
                                                                            color: role.themeColor || 'inherit',
                                                                            marginRight: '0.7em'
                                                                        }}
                                                                    >
                                                                        {roleIconDef ? (
                                                                            <FontAwesomeIcon icon={roleIconDef} className="text-[1em]" />
                                                                        ) : (
                                                                            <span className="text-[1em]">{role.icon || '👤'}</span>
                                                                        )}
                                                                    </div>

                                                                    {/* Role Name (Truncated, shrinks if needed) */}
                                                                    <div
                                                                        className={`truncate text-[0.95em] transition-opacity min-w-0 ${isArrowHovered ? '!opacity-100 !text-[var(--text-color)]' : 'opacity-70 group-hover/role:opacity-100'
                                                                            }`}
                                                                    >
                                                                        {role.name.toLowerCase()}
                                                                    </div>

                                                                    {/* Member Count - closer to name */}
                                                                    {hasMembers && (
                                                                        <span
                                                                            className={`ml-[0.4em] text-[0.8em] transition-opacity ${isArrowHovered ? '!opacity-80' : 'opacity-50 group-hover/role:opacity-80'
                                                                                }`}
                                                                        >
                                                                            ({members.length})
                                                                        </span>
                                                                    )}

                                                                    {/* Actions & Active Indicator - Packed left with consistent gap */}
                                                                    <div className="flex items-center shrink-0 ml-auto gap-2">
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleEditRole(e, team.id, role.id); }}
                                                                            className="opacity-0 group-hover/role:opacity-100 transition-all hover:!text-[var(--main-color)]"
                                                                            style={{ color: 'var(--bg-color)' }}
                                                                        >
                                                                            <FontAwesomeIcon icon={faCog} className="text-[0.8em]" />
                                                                        </button>
                                                                        {isActive && (
                                                                            <FontAwesomeIcon icon={faCheck} className="text-[0.7em]" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Members (expanded) */}
                                                            {isRoleExpanded && hasMembers && (
                                                                <div className="flex flex-col">
                                                                    {members.map(member => (
                                                                        <div
                                                                            key={member.uid}
                                                                            onClick={() => handleMemberClick(member, team.id, role.id)}
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
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {/* Add Role Button (always owner) */}
                                                <button
                                                    onClick={(e) => handleCreateRole(e, team.id)}
                                                    className="group/add flex items-center text-left transition-colors duration-100 leading-none text-[var(--sub-color)] hover:text-[var(--bg-color)] hover:bg-[var(--text-color)]"
                                                    style={{ padding: '0.4em 0', paddingLeft: '2em' }}
                                                >
                                                    <div
                                                        className="w-[1em] h-[1em] flex items-center justify-center shrink-0 opacity-60 group-hover/add:opacity-100"
                                                        style={{ marginRight: '0.7em' }}
                                                    >
                                                        <FontAwesomeIcon icon={faPlus} className="text-[1em]" />
                                                    </div>
                                                    <span className="text-[0.9em]">add role</span>
                                                </button>

                                                {/* Separator after expanded content - only if not last team */}
                                                {index !== ownedTeams.length - 1 && (
                                                    <div
                                                        className="h-[1px] mx-0 opacity-10 shrink-0 mt-2 mb-1"
                                                        style={{ backgroundColor: 'var(--sub-color)' }}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}

                        {/* Separator */}
                        <div
                            className="h-[1px] mx-0 opacity-10 shrink-0"
                            style={{ backgroundColor: 'var(--sub-color)' }}
                        />

                        {/* Create Team */}
                        <button
                            onClick={handleCreateTeam}
                            className="group flex items-center justify-start text-left w-full leading-none text-[var(--text-color)] hover:text-[var(--bg-color)] hover:bg-[var(--text-color)]"
                            style={{ padding: '0.5em 0' }}
                        >
                            <div
                                className="w-[1em] h-[1em] flex items-center justify-center shrink-0 opacity-80 group-hover:opacity-100"
                                style={{ marginLeft: '0.9em', marginRight: '0.7em' }}
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-[1em]" />
                            </div>
                            <span className="truncate pt-[0.1em] opacity-80 group-hover:opacity-100 transition-opacity">create team</span>
                        </button>

                        {/* Join with Invite */}
                        <button
                            onClick={() => setIsJoinModalOpen(true)}
                            className="group flex items-center justify-start text-left w-full leading-none text-[var(--text-color)] hover:text-[var(--bg-color)] hover:bg-[var(--text-color)] rounded-b-[0.5rem]"
                            style={{ padding: '0.5em 0' }}
                        >
                            <div
                                className="w-[1em] h-[1em] flex items-center justify-center shrink-0 opacity-80 group-hover:opacity-100"
                                style={{ marginLeft: '0.9em', marginRight: '0.7em' }}
                            >
                                <FontAwesomeIcon icon={faLink} className="text-[1em]" />
                            </div>
                            <span className="truncate pt-[0.1em] opacity-80 group-hover:opacity-100 transition-opacity">join with invite</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <TeamSettingsModal
                isOpen={isTeamModalOpen}
                onClose={() => setIsTeamModalOpen(false)}
                teamId={editingTeamId}
            />

            <RoleSettingsModal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                teamId={activeTeamId}
                roleId={editingRoleId}
            />

            <JoinTeamModal
                isOpen={isJoinModalOpen}
                onClose={() => setIsJoinModalOpen(false)}
            />
        </>
    );
}
