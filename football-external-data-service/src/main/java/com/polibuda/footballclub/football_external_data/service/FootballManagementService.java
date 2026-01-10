package com.polibuda.footballclub.football_external_data.service;

import com.polibuda.footballclub.common.actions.AuditActionType;
import com.polibuda.footballclub.football_external_data.aop.Auditable;
import com.polibuda.footballclub.football_external_data.entity.PlayerEntity;
import com.polibuda.footballclub.football_external_data.entity.TeamEntity;
import com.polibuda.footballclub.football_external_data.repository.PlayerRepository;
import com.polibuda.footballclub.football_external_data.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FootballManagementService {

    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;

    @Transactional(readOnly = true)
    public List<TeamEntity> getAllTeams() {
        return teamRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public Optional<TeamEntity> getTeamWithDetails(Long id) {
        return teamRepository.findWithPlayersById(id);
    }

    @Auditable(actionType = AuditActionType.DELETE, resourceName = "Team", description = "Complete team deletion")
    @Transactional
    public void deleteTeamCompletely(Long teamId) {
        TeamEntity team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found: " + teamId));

        for (PlayerEntity player : team.getPlayers()) {
            player.getTeams().remove(team);
            playerRepository.save(player); // Aktualizacja strony owning side jeśli trzeba
        }
        
        teamRepository.delete(team);
        log.info("Deleted team {} and its associations.", teamId);
    }
    @Auditable(actionType = AuditActionType.DELETE, resourceName = "Player", description = "Player deletion")
    @Transactional
    public void deletePlayer(Long playerId) {
        PlayerEntity player = playerRepository.findById(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Player not found"));

        player.getTeams().forEach(team -> team.getPlayers().remove(player));
        
        playerRepository.delete(player);
        log.info("Deleted player {}", playerId);
    }
}