package com.polibuda.footballclub.football_external_data.service;

import com.polibuda.footballclub.football_external_data.entity.PlayerEntity;
import com.polibuda.footballclub.football_external_data.entity.TeamEntity;
import com.polibuda.footballclub.football_external_data.entity.VenueEntity;
import com.polibuda.footballclub.football_external_data.repository.PlayerRepository;
import com.polibuda.footballclub.football_external_data.repository.TeamRepository;
import com.polibuda.footballclub.football_external_data.repository.VenueRepository; // Zakładam, że stworzysz
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional // Kluczowe: cała metoda to jedna transakcja
public class FootballWriteService {

    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final VenueRepository venueRepository; // Wymaga dodania interfejsu repozytorium

    /**
     * Zapisuje lub aktualizuje drużynę wraz z jej stadionem.
     */
    public TeamEntity saveOrUpdateTeam(TeamEntity team, VenueEntity venue) {
        if (venue != null) {
            // Zapisz/Update stadionu niezależnie
            venue = venueRepository.save(venue);
            // Dodaj stadion do drużyny (relacja ManyToMany)
            team.getVenues().add(venue);
        }

        // 2. Zapisz/Update Drużyny
        log.info("Persisting team: {} [{}]", team.getName(), team.getId());
        return teamRepository.save(team);
    }

    /**
     * Zapisuje zawodników i przypisuje ich do podanej drużyny.
     */
    public void saveSquadForTeam(TeamEntity team, Set<PlayerEntity> players) {
        for (PlayerEntity player : players) {
            player.getTeams().add(team);
            playerRepository.save(player);
        }
        log.info("Updated squad for team {}: {} players processed.", team.getName(), players.size());
    }
}