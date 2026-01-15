package com.polibuda.footballclub.match.service.domain;

import com.polibuda.footballclub.match.config.FootballGrpcClient;
import com.polibuda.footballclub.match.dto.fromMatchService.MatchMemberDto;
import com.polibuda.footballclub.match.dto.fromMatchService.MatchTeamDto;
import com.polibuda.footballclub.match.dto.fromMatchService.PhysicalProfileDto;
import com.polibuda.footballclub.match.dto.response.TeamBasicResponseDTO;
import com.polibuda.footballclub.match.dto.response.TeamDetailsResponseDTO;
import com.polibuda.footballclub.match.exceptions.ResourceNotFoundException;
import com.polibuda.footballclub.match.service.MatchIntegrationClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamProviderService {

    private final MatchIntegrationClient userClient;    // Internal Teams
    private final FootballGrpcClient externalClient;    // External Teams

    // --- INTERNAL TEAMS (User Service) ---

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


    public List<TeamBasicResponseDTO> getAllExternalTeams() {
        return externalClient.getAllTeams();
    }

    public TeamDetailsResponseDTO getExternalTeamDetails(Long teamId) {
        try {
            return externalClient.getTeamDetails(teamId);
        } catch (Exception e) {
            log.error("Failed to fetch external team details for id: {}", teamId, e);
            throw new ResourceNotFoundException("External Team not found via gRPC, id: " + teamId);
        }
    }
}