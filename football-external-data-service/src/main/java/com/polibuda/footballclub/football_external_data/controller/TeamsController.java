package com.polibuda.footballclub.football_external_data.controller;

import com.polibuda.footballclub.football_external_data.dto.clubs.TeamSummaryDataDTO;
import com.polibuda.footballclub.football_external_data.dto.response.TeamDetailsResponseDTO;
import com.polibuda.footballclub.football_external_data.service.FootballFacadeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/external/teams")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PLAYER')")
public class TeamsController {

    private final FootballFacadeService facadeService;

    @GetMapping
    public ResponseEntity<List<TeamSummaryDataDTO>> getAllTeams() {
        return ResponseEntity.ok(facadeService.getAllTeams());
    }

    @GetMapping("/{teamId}")
    public ResponseEntity<TeamDetailsResponseDTO> getTeamDetails(@PathVariable Long teamId) {
        return ResponseEntity.ok(facadeService.getTeamDetails(teamId));
    }
}