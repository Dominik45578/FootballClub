package com.polibuda.footballclub.match.service.domain;

import com.polibuda.footballclub.match.config.FootballGrpcClient;
import com.polibuda.footballclub.match.dto.fromMatchService.MatchMemberDto;
import com.polibuda.footballclub.match.dto.fromMatchService.MatchTeamDto;
import com.polibuda.footballclub.match.dto.fromMatchService.PhysicalProfileDto;
import com.polibuda.footballclub.match.dto.response.TeamBasicResponseDTO;
import com.polibuda.footballclub.match.dto.response.TeamDetailsResponseDTO;
import com.polibuda.footballclub.match.exceptions.ExternalTeamMustExistException;
import com.polibuda.footballclub.match.exceptions.InsufficientPermissionsException;
import com.polibuda.footballclub.match.exceptions.ResourceNotFoundException;
import com.polibuda.footballclub.match.service.MatchIntegrationClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamProviderService {

    private final MatchIntegrationClient userClient;
    private final FootballGrpcClient externalClient;


    public MatchTeamDto getInternalTeam(Long teamId) {
        return userClient.getTeamForMatch(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Internal Team not found via gRPC, id: " + teamId));
    }

    public MatchMemberDto getInternalTeamMember(Long teamMemberId) {
        return userClient.getTeamMember(teamMemberId)
                .orElseThrow(() -> new ResourceNotFoundException("Internal Team Member not found via gRPC, id: " + teamMemberId));
    }

    public PhysicalProfileDto getPlayerPhysicalProfile(Long memberId) {
        return userClient.getPlayerPhysicalProfile(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Physical Profile not found via gRPC, memberId: " + memberId));
    }

    public List<Long> getInternalTeamIds(Long userId) {
        try {
            return userClient.getUserTeams(userId);
        } catch (Exception e) {
            log.error("Failed to fetch internal team ids for userId: {}", userId, e);
            throw new ResourceNotFoundException("Could not fetch teams/user not found via gRPC, userId: " + userId);
        }
    }


    public void validateUserIsCoach(Long userId, Long teamId) {
        if (!isUserCoachOfTeam(userId, teamId)) {
            throw new InsufficientPermissionsException("User " + userId + " does not have COACH permissions for team " + teamId);
        }
    }


    public boolean isUserCoachOfTeam(Long userId, Long teamId) {
        MatchTeamDto team = getInternalTeam(teamId);
        return team.getMembers().stream()
                .filter(member -> Objects.equals(member.getMemberId(), userId))
                .anyMatch(this::hasCoachRole);
    }


    public List<TeamBasicResponseDTO> getAllExternalTeams() {
        return externalClient.getAllTeams();
    }

    public TeamDetailsResponseDTO getExternalTeamDetails(Long teamId) {
        try {
            return externalClient.getTeamDetails(teamId);
        } catch (Exception e) {
            log.error("Failed to fetch external team details for id: {}", teamId, e);
            throw new ExternalTeamMustExistException("External Team not found or service unavailable via gRPC, id: " + teamId);
        }
    }


    private boolean hasCoachRole(MatchMemberDto member) {
        if (member.getRoles() == null || member.getRoles().isEmpty()) {
            return false;
        }
        return member.getRoles().stream()
                .anyMatch(role -> role.toUpperCase().contains("COACH"));
    }
}