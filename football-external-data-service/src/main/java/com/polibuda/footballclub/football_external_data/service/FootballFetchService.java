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

    public GetClubsDTO fetchClubsByCountry(String country) {
        try {
            log.debug("Fetching clubs by country {}", country);
            return footballApiClient.getTeamsByCountry(country);
        } catch (Exception e) {
            log.error("Error fetching clubs for country: {}", country, e);
            throw new RuntimeException("External API unavailable for clubs fetch", e);
        }
    }

    public GetSquadDataDTO fetchSquadByTeamId(Long teamId) {
        try {
            GetSquadDataDTO get =  footballApiClient.getSquad(teamId);
            log.info("Errors {}",get.getErrors().toString());
            return get;
        } catch (Exception e) {
            log.error("Error fetching squad for team: {}", teamId, e);
            throw new RuntimeException("External API unavailable for squad fetch", e);
        }
    }
}