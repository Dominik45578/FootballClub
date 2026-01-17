package com.polibuda.footballclub.football_external_data.service;

import com.polibuda.footballclub.common.actions.AuditActionType;
import com.polibuda.footballclub.football_external_data.aop.Auditable;
import com.polibuda.footballclub.football_external_data.dto.clubs.TeamSummaryDataDTO;
import com.polibuda.footballclub.football_external_data.dto.response.TeamDetailsResponseDTO;
import com.polibuda.footballclub.football_external_data.entity.TeamEntity;
import com.polibuda.footballclub.football_external_data.mapper.PlayerMapper;
import com.polibuda.footballclub.football_external_data.mapper.TeamMapper;
import com.polibuda.footballclub.football_external_data.mapper.VenueMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FootballFacadeService {

    private final FootballDomainService domainService;
    private final FootballDataProcessingService processingService;
    private final TeamMapper teamMapper;
    private final VenueMapper venueMapper;
    private final PlayerMapper playerMapper;



    @Auditable(actionType = AuditActionType.MANUAL_REFRESH, resourceName = "Teams", description = "Refreshing teams by Country")
    public void refreshTeamsForCountry(String country) {
        processingService.importTeamsByCountry(country);
    }

    @Auditable(actionType = AuditActionType.MANUAL_REFRESH, resourceName = "Squads", description = "Refreshing squads using id")
    public void refreshSquadForTeam(Long teamId) {
        processingService.importSquadForTeam(teamId);
    }

    @Transactional(readOnly = true)
    public Page<TeamSummaryDataDTO> searchTeams(String searchTerm, Pageable pageable) {
        return domainService.searchTeams(searchTerm, pageable)
                .map(teamMapper::toSummaryDto);
    }
    @Transactional(readOnly = true)
    public Page<TeamSummaryDataDTO> getAllTeamsPaged(Pageable pageable) {
        return domainService.getAllTeamsPaged(pageable) // Zakładamy, że ta metoda w domenie przyjmuje Pageable
                .map(teamMapper::toSummaryDto);
    }

    /**
     * Pobiera wszystkie zespoły (stronicowane) i mapuje wyniki na DTO.
     * Dodano argument Pageable, aby umożliwić nawigację po danych.
     */
    @Transactional(readOnly = true)
    public List<TeamSummaryDataDTO> getAllTeams() {
        return domainService.getAllTeams().stream().map(teamMapper::toSummaryDto).toList();
    }

    @Transactional(readOnly = true)
    public TeamDetailsResponseDTO getTeamDetails(Long teamId) {
        TeamEntity team = domainService.getTeamWithPlayers(teamId);

        return TeamDetailsResponseDTO.builder()
                .teamInfo(teamMapper.toDto(team))
                .venue(team.getVenues().stream()
                        .findFirst()
                        .map(venueMapper::toDto)
                        .orElse(null))
                .squad(team.getPlayers().stream()
                        .map(playerMapper::toDto)
                        .collect(Collectors.toList()))
                .build();
    }
}