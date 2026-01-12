package com.polibuda.footballclub.football_external_data.model;

import com.polibuda.footballclub.football_external_data.config.FedProperties;
import com.polibuda.footballclub.football_external_data.dto.clubs.GetClubsDTO;
import com.polibuda.footballclub.football_external_data.dto.squads.GetSquadDataDTO;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;

/**
 * Deklaratywny klient HTTP.
 * Wszystkie "defaulty" (metoda, ścieżka) są zdefiniowane w adnotacjach.
 */
@HttpExchange ("")// Bazowa adnotacja, można tu dać wspólny prefix URL
public interface FootballApiClient {

    @GetExchange("${api.football.teams.url}") // To definiuje metodę GET i endpoint
    GetClubsDTO getTeamsByCountry(@RequestParam("country") String country);

    @GetExchange("${api.football.teams.url}")
    GetClubsDTO getTeamById(@RequestParam("id") Long id);

    @GetExchange("${api.football.squads.url}")
    GetSquadDataDTO getSquad(@RequestParam("team") Long team);
}