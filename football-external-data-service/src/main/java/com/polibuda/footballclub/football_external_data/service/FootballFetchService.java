package com.polibuda.footballclub.football_external_data.service;

import com.polibuda.footballclub.football_external_data.dto.clubs.GetClubsDTO;
import com.polibuda.footballclub.football_external_data.dto.squads.GetSquadDataDTO;
import com.polibuda.footballclub.football_external_data.model.FootballApiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class FootballFetchService {

    private final FootballApiClient footballApiClient;

    /**
     * Pobiera dane o klubach dla danego kraju.
     */
    public GetClubsDTO fetchClubsByCountry(String country) {
        log.info("Fetching clubs for country: {}", country);
        try {
            return footballApiClient.getTeamsByCountry(country);
        } catch (Exception e) {
            log.error("Error fetching clubs for country {}: {}", country, e.getMessage());
            throw new RuntimeException("External API unavailable for clubs fetch", e);
        }
    }

    /**
     * Pobiera skład (zawodników) dla konkretnego zespołu.
     */
    public GetSquadDataDTO fetchSquadByTeamId(Long teamId) {
        log.debug("Fetching squad for team ID: {}", teamId);
        try {
            return footballApiClient.getSquad(teamId);
        } catch (Exception e) {
            log.error("Error fetching squad for team {}: {}", teamId, e.getMessage());
            throw new RuntimeException("External API unavailable for squad fetch", e);
        }
    }
}