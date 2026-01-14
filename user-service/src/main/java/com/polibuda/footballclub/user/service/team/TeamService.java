package com.polibuda.footballclub.user.service.team;

import com.polibuda.footballclub.common.actions.TeamFetchMode;
import com.polibuda.footballclub.user.dto.request.AddTeamRequest;
import com.polibuda.footballclub.user.dto.request.UpdateMemberProfileRequest;
import com.polibuda.footballclub.user.dto.request.UpdateTeamMemberRequestDTO;
import com.polibuda.footballclub.user.dto.request.UpdateTeamRequestDTO;
import com.polibuda.footballclub.user.dto.response.restricted.TeamDetailsResponse;
import com.polibuda.footballclub.user.dto.response.summary.TeamSummaryResponse;
import com.polibuda.footballclub.user.dto.response.summary.wrappers.TeamSearchResponse;
import com.polibuda.footballclub.user.entity.Team;
import org.springframework.data.domain.Pageable;

public interface TeamService {

    /**
     * Główna metoda do pobierania zespołów w różnych trybach.
     *
     * @param mode Strategia pobierania (MOJE, KONKRETNY, WSZYSTKIE)
     * @param requesterUserId ID użytkownika wykonującego zapytanie (potrzebne dla trybu MY_TEAMS)
     * @param specificTeamId Opcjonalne ID konkretnego zespołu (potrzebne dla trybu SPECIFIC_TEAM)
     * @param nameFilter Opcjonalny filtr po nazwie (dla trybu ALL_TEAMS)
     * @param pageable Parametry stronicowania
     * @return Wrapper zawierający listę wyników i metadane wyszukiwania
     */
    TeamSearchResponse getTeams(TeamFetchMode mode,
                                Long requesterUserId,
                                Long specificTeamId,
                                String nameFilter,
                                Pageable pageable);

    /**
     * Pobiera szczegółowe dane konkretnego zespołu wraz z listą członków.
     * Wymaga dociągnięcia relacji (EntityGraph).
     *
     * @param teamId ID zespołu
     * @return Szczegółowy obiekt DTO
     */
    TeamDetailsResponse getTeamDetails(Long teamId);
    TeamSummaryResponse getTeamProfile(Long teamId);
    boolean addTeam(AddTeamRequest team, Long requesterUserId);
    boolean updateTeam(UpdateTeamRequestDTO request, Long requesterUserId);
    boolean updateMembership(UpdateTeamMemberRequestDTO request, Long requesterUserId);
    boolean deleteTeam(Long teamId, Long requesterUserId);
}