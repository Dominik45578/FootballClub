package com.polibuda.footballclub.football_external_data.service;

import com.polibuda.footballclub.common.actions.AuditActionType;
import com.polibuda.footballclub.football_external_data.aop.Auditable;
import com.polibuda.footballclub.football_external_data.entity.PlayerEntity;
import com.polibuda.footballclub.football_external_data.entity.TeamEntity;
import com.polibuda.footballclub.football_external_data.entity.VenueEntity;
import com.polibuda.footballclub.football_external_data.repository.PlayerRepository;
import com.polibuda.footballclub.football_external_data.repository.TeamRepository;
import com.polibuda.footballclub.football_external_data.repository.VenueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class FootballDomainService {

    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final VenueRepository venueRepository;


    @Transactional
    public TeamEntity saveTeam(TeamEntity team) {
        return teamRepository.save(team);
    }

    @Transactional
    public VenueEntity saveVenue(VenueEntity venue) {
        return venueRepository.save(venue);
    }

    @Transactional
    public void addVenueToTeam(Long teamId, VenueEntity venue) {
        TeamEntity team = getTeamById(teamId);
        team.getVenues().add(venue);
        teamRepository.save(team);
    }

    @Transactional
    public void addPlayersToTeam(Long teamId, Set<PlayerEntity> players) {
        TeamEntity team = getTeamById(teamId);
        players.forEach(player -> {
            player.getTeams().add(team);
            playerRepository.save(player);
        });
    }

    // --- ODCZYT (istniejące metody) ---

    @Transactional(readOnly = true)
    public TeamEntity getTeamById(Long id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Team not found with ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<TeamEntity> getAllTeams() {
        return teamRepository.findAll();
    }

    @Transactional(readOnly = true)
    public PlayerEntity getPlayerById(Long id) {
        return playerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Player not found with ID: " + id));
    }

    @Transactional(readOnly = true)
    public TeamEntity getTeamWithPlayers(Long id) {
        return teamRepository.findWithPlayersById(id)
                .orElseThrow(() -> new IllegalArgumentException("Team not found with ID: " + id));
    }

    // --- USUWANIE (Logika przeniesiona z ManagementService) ---

    @Transactional
    public void deleteTeamCompletely(Long teamId) {
        TeamEntity team = getTeamById(teamId);

        // Rozpinanie relacji: usuwamy drużynę z listy drużyn każdego zawodnika
        for (PlayerEntity player : team.getPlayers()) {
            player.getTeams().remove(team);
            playerRepository.save(player);
        }

        teamRepository.delete(team);
        log.info("Deleted team {} and its associations.", teamId);
    }

    @Transactional
    public void deletePlayer(Long playerId) {
        PlayerEntity player = getPlayerById(playerId);

        // Rozpinanie relacji: usuwamy gracza ze składów wszystkich drużyn
        player.getTeams().forEach(team -> team.getPlayers().remove(player));

        playerRepository.delete(player);
        log.info("Deleted player {}", playerId);
    }
}