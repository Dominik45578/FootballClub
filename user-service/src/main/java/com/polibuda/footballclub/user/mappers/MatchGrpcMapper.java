package com.polibuda.footballclub.user.mappers;

import com.polibuda.footballclub.common.actions.TeamMemberStatus;
import com.polibuda.footballclub.common.claims.FieldPosition;
import com.polibuda.footballclub.common.database.TeamRole;
import com.polibuda.footballclub.match.grpc.*;
import com.polibuda.footballclub.user.entity.Member;
import com.polibuda.footballclub.user.entity.Team;
import com.polibuda.footballclub.user.entity.TeamMember;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class MatchGrpcMapper {
    public GetUserTeamsResponse mapToGetUserTeamsResponse(Long userId, Collection<Long> teams) {
        return GetUserTeamsResponse.newBuilder()
                .setUserId(userId)
                .addAllTeamIds(teams)
                .build();
    }


    public TeamForMatchResponse mapToTeamResponse(Team team) {
        return TeamForMatchResponse.newBuilder()
                .setTeamId(team.getId())
                .setTeamName(team.getName())
                .setCategory(team.getCategory().name())
                .addAllMembers(mapMembers(team.getMembers()))
                .build();
    }

    public TeamMemberForMatchResponse mapToTeamMemberResponse(TeamMember teamMember) {
        return TeamMemberForMatchResponse.newBuilder()
                .setTeamMemberId(teamMember.getId())
                .setTeamId(teamMember.getTeam().getId())
                .setMemberId(teamMember.getMember().getId())
                .setFirstName(teamMember.getMember().getFirstName())
                .setLastName(teamMember.getMember().getLastName())
                .setStatus(mapStatus(teamMember.getStatus()))
                .setFieldPosition(mapFieldPosition(teamMember.getFieldPosition()))
                .addAllRoles(mapRoles(teamMember.getRoles()))
                .build();
    }

    public PlayerPhysicalProfileResponse mapToPhysicalProfile(Member member) {
        return PlayerPhysicalProfileResponse.newBuilder()
                .setMemberId(member.getId())
                .setUserId(member.getUserId())
                .setFirstName(member.getFirstName())
                .setLastName(member.getLastName())
                .build();
    }

    // --- Helpers & Enum Mappings ---

    private List<MatchTeamMemberDto> mapMembers(Collection<TeamMember> members) {
        if (members == null) return Collections.emptyList();
        
        return members.stream()
                // Filtrujemy tylko aktywnych lub oczekujących, jeśli biznes tak wymaga.
                // Tutaj mapujemy wszystkich, bo MatchService może chcieć widzieć ławkę rezerwowych.
                .map(tm -> MatchTeamMemberDto.newBuilder()
                        .setTeamMemberId(tm.getId())
                        .setMemberId(tm.getMember().getId())
                        .setFirstName(tm.getMember().getFirstName())
                        .setLastName(tm.getMember().getLastName())
                        .setStatus(mapStatus(tm.getStatus()))
                        .setFieldPosition(mapFieldPosition(tm.getFieldPosition()))
                        .addAllRoles(mapRoles(tm.getRoles()))
                        .build())
                .collect(Collectors.toList());
    }

    private MatchTeamMemberStatus mapStatus(TeamMemberStatus status) {
        if (status == null) return MatchTeamMemberStatus.STATUS_UNSPECIFIED;
        try {
            return MatchTeamMemberStatus.valueOf(status.name());
        } catch (IllegalArgumentException e) {
            return MatchTeamMemberStatus.STATUS_UNSPECIFIED;
        }
    }

    private MatchFieldPosition mapFieldPosition(FieldPosition position) {
        if (position == null) return MatchFieldPosition.POSITION_UNSPECIFIED;
        try {
            return MatchFieldPosition.valueOf(position.name());
        } catch (IllegalArgumentException e) {
            return MatchFieldPosition.POSITION_UNSPECIFIED;
        }
    }

    private List<MatchTeamRole> mapRoles(Set<TeamRole> roles) {
        if (roles == null) return Collections.emptyList();
        return roles.stream()
                .map(this::mapRole)
                .collect(Collectors.toList());
    }

    private MatchTeamRole mapRole(TeamRole role) {
        if (role == null) return MatchTeamRole.ROLE_UNSPECIFIED;
        try {
            return MatchTeamRole.valueOf(role.name());
        } catch (IllegalArgumentException e) {
            return MatchTeamRole.ROLE_UNSPECIFIED;
        }
    }
}