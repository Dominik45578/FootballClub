package com.polibuda.footballclub.football_external_data.service;

import com.polibuda.footballclub.football_external_data.entity.PlayerEntity;
import com.polibuda.footballclub.football_external_data.entity.TeamEntity;
import com.polibuda.footballclub.football_external_data.repository.PlayerRepository;
import com.polibuda.footballclub.football_external_data.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // Optymalizacja dla odczytów
public class FootballReadService {

    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;

    // --- TEAMS ---

    public Optional<TeamEntity> findTeamById(Long id) {
        return teamRepository.findWithPlayersById(id); // Używa EntityGraph z repozytorium
    }

    public List<TeamEntity> findTeamsByName(String nameFragment) {
        return teamRepository.findAllByNameContainingIgnoreCase(nameFragment);
    }

    public Optional<TeamEntity> findTeamByCode(String code) {
        return teamRepository.findByCode(code);
    }
    
    public List<TeamEntity> findAllTeams() {
        return teamRepository.findAll();
    }

    // --- PLAYERS ---

    public Optional<PlayerEntity> findPlayerById(Long id) {
        return playerRepository.findById(id);
    }

    public List<PlayerEntity> findPlayersByName(String nameFragment) {
        return playerRepository.findAllByNameContainingIgnoreCase(nameFragment);
    }
}