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
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamProviderService {

    private final MatchIntegrationClient userClient;    // Internal Teams (User Service)
    private final FootballGrpcClient externalClient;    // External Teams (Football Data)

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

    public List<Long> getInternalTeamIds(Long userId) {
        try {
            return userClient.getUserTeams(userId);
        } catch (Exception e) {
            log.error("Failed to fetch internal team ids for userId: {}", userId, e);
            throw new ResourceNotFoundException("Could not fetch teams for user via gRPC, userId: " + userId);
        }
    }

    /**
     * Sprawdza, czy dany użytkownik jest trenerem w zespole.
     */
    public boolean isUserCoachOfTeam(Long userId, Long teamId) {
        try {
            // 1. Pobieramy dane zespołu (metoda rzuci wyjątek, jeśli zespół nie istnieje)
            MatchTeamDto team = getInternalTeam(teamId);

            // 2. Szukamy użytkownika na liście członków i sprawdzamy jego rolę
            return team.getMembers().stream()
                    .filter(member -> Objects.equals(member.getMemberId(), userId)) // Szukamy po memberId/userId
                    .anyMatch(this::hasCoachRole); // Sprawdzamy czy ma rolę trenera

        } catch (Exception e) {
            log.warn("Error checking permissions for user {} in team {}", userId, teamId, e);
            return false; // W przypadku błędu bezpieczniej zwrócić false (brak dostępu)
        }
    }

    // --- EXTERNAL TEAMS (Football Data Service) ---

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

    // --- METODY POMOCNICZE ---

    private boolean hasCoachRole(MatchMemberDto member) {
        if (member.getRoles() == null) return false;
        // Sprawdzamy czy którakolwiek z ról zawiera "COACH" (np. ROLE_TEAM_HEAD_COACH)
        return member.getRoles().stream()
                .anyMatch(role -> role.toUpperCase().contains("COACH"));
    }
}