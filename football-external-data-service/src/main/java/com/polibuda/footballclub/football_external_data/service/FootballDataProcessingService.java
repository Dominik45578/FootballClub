package com.polibuda.footballclub.football_external_data.service;

import com.polibuda.footballclub.football_external_data.dto.clubs.GetClubsDTO;
import com.polibuda.footballclub.football_external_data.dto.squads.GetSquadDataDTO;
import com.polibuda.footballclub.football_external_data.entity.PlayerEntity;
import com.polibuda.footballclub.football_external_data.entity.TeamEntity;
import com.polibuda.footballclub.football_external_data.entity.VenueEntity;
import com.polibuda.footballclub.football_external_data.mapper.PlayerMapper;
import com.polibuda.footballclub.football_external_data.mapper.TeamMapper;
import com.polibuda.footballclub.football_external_data.mapper.VenueMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FootballDataProcessingService {

    private final FootballFetchService fetchService;
    private final FootballDomainService domainService;
    private final FootballDataValidator validator;
    private final TeamMapper teamMapper;
    private final VenueMapper venueMapper;
    private final PlayerMapper playerMapper;

    @Transactional
    public void importTeamsByCountry(String country) {
        log.info("Starting import for country: {}", country);
        GetClubsDTO clubsDTO = fetchService.fetchClubsByCountry(country);

        if (clubsDTO.getResponse() == null) {
            log.error("Error fetching clubs for country: {} , null dto", country);
            return;
        };
        log.info("DTO {}", clubsDTO.toString());

        clubsDTO.getResponse().stream()
                .filter(validator::validateClubData)
                .forEach(wrapper -> {
                    TeamEntity teamEntity = teamMapper.toEntity(wrapper.getTeam());
                    TeamEntity savedTeam = domainService.saveTeam(teamEntity);

                    if (wrapper.getVenue() != null) {
                        VenueEntity venueEntity = venueMapper.toEntity(wrapper.getVenue());
                        VenueEntity savedVenue = domainService.saveVenue(venueEntity);
                        domainService.addVenueToTeam(savedTeam.getId(), savedVenue);
                    }
                });
    }

    @Transactional
    public void importSquadForTeam(Long teamId) {
        log.info("Starting squad import for team: {}", teamId);
        GetSquadDataDTO squadDTO = fetchService.fetchSquadByTeamId(teamId);

        if (squadDTO.getResponse().getFirst().getPlayers()== null){
            log.error("Error fetching squads for team: {} , null dto", teamId);
            return;
        }
        log.info("DTO {}", squadDTO.toString());


        Set<PlayerEntity> players = squadDTO.getResponse().getFirst().getPlayers().stream()
                .filter(validator::validatePlayerData)
                .map(playerMapper::toEntity)
                .collect(Collectors.toSet());

        domainService.addPlayersToTeam(teamId, players);
    }
}