package com.polibuda.footballclub.football_external_data.controller;

import com.polibuda.footballclub.football_external_data.dto.clubs.TeamSummaryDataDTO;
import com.polibuda.footballclub.football_external_data.dto.response.TeamDetailsResponseDTO;
import com.polibuda.footballclub.football_external_data.service.FootballFacadeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/external/teams")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PLAYER')")
public class TeamsController {

    private final FootballFacadeService facadeService;

    @GetMapping
    public ResponseEntity<Page<TeamSummaryDataDTO>> getAllTeams(
            @RequestParam(required = false) String query,
            @PageableDefault(page = 20) Pageable pageable
    ) {
        if(query == null){
            return ResponseEntity.ok(facadeService.getAllTeamsPaged(pageable));
        }
        return ResponseEntity.ok(facadeService.searchTeams(query, pageable));
    }

    @GetMapping("/{teamId}")
    public ResponseEntity<TeamDetailsResponseDTO> getTeamDetails(@PathVariable Long teamId) {
        return ResponseEntity.ok(facadeService.getTeamDetails(teamId));
    }
}