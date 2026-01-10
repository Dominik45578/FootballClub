package com.polibuda.footballclub.football_external_data.service;

import com.polibuda.footballclub.football_external_data.FootballDataMapper;
import com.polibuda.footballclub.football_external_data.dto.clubs.GetClubsDTO;
import com.polibuda.footballclub.football_external_data.dto.squads.GetSquadDataDTO;
import com.polibuda.footballclub.football_external_data.entity.PlayerEntity;
import com.polibuda.footballclub.football_external_data.entity.TeamEntity;
import com.polibuda.footballclub.football_external_data.entity.VenueEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FootballImportOrchestrator {

    private final FootballFetchService fetchService;
    private final FootballDataMapper mapper;
    private final FootballWriteService writeService;
    private final FootballDataValidator validator;
    private final FootballReadService readService;


    public void runFullImportForCountry(String country) {
        log.info("Starting full import orchestration for country: {}", country);

        // 1. Pobranie danych klubów
        GetClubsDTO clubsDTO = fetchService.fetchClubsByCountry(country);

        if (clubsDTO.getResponse() == null) return;
        if(clubsDTO.getErrors() != null) {
            log.error("Error while full import orchestration for country: {} error stack : {}", country , clubsDTO.getErrors());
        }

        // 2. Iteracja po klubach
        clubsDTO.getResponse().stream()
                .filter(validator::validateClubData)
                .forEach(wrapper -> {
                    // a. Mapowanie
                    TeamEntity teamEntity = mapper.mapToTeamEntity(wrapper.getTeam());
                    VenueEntity venueEntity = mapper.mapToVenueEntity(wrapper.getVenue());

                    // b. Zapis Drużyny i Stadionu
                    TeamEntity savedTeam = writeService.saveOrUpdateTeam(teamEntity, venueEntity);

                    // c. Pobranie i zapis składu (Squad)
                    importSquadForTeam(savedTeam);
                });
        
        log.info("Import completed for country: {}", country);
    }

    public void importSquadForTeam(TeamEntity team) {
        try {
            GetSquadDataDTO squadDTO = fetchService.fetchSquadByTeamId(team.getId());
            
            if (squadDTO.getPlayers() == null) return;

            Set<PlayerEntity> players = squadDTO.getPlayers().stream()
                    .filter(validator::validatePlayerData)
                    .map(mapper::mapToPlayerEntity)
                    .collect(Collectors.toSet());

            writeService.saveSquadForTeam(team, players);

        } catch (Exception e) {
            log.error("Failed to import squad for team {}", team.getId(), e);
        }
    }

    public void importSquadForTeamById(Long id){
        importSquadForTeam(readService.findTeamById(id).orElseThrow());
    }
}