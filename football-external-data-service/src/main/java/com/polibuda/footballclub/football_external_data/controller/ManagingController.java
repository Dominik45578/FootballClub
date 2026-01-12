package com.polibuda.footballclub.football_external_data.controller;

import com.polibuda.footballclub.common.claims.MutationHeaderClaims;
import com.polibuda.footballclub.football_external_data.service.FootballFacadeService;
import com.polibuda.footballclub.football_external_data.service.FootballManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("external/manage")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
public class ManagingController {

    private final FootballFacadeService facadeService;
    private final FootballManagementService managementService;


    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    @PostMapping("/refresh/teams")
    public ResponseEntity<Void> refreshTeams(@RequestParam("country") String country,
                                             @RequestHeader(value = MutationHeaderClaims.X_USER_ID, required = false) String userId) {
        facadeService.refreshTeamsForCountry(country);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    @PostMapping("/refresh/squad")
    public ResponseEntity<Void> refreshSquad(@RequestParam("teamId") Long teamId) {
        facadeService.refreshSquadForTeam(teamId);
        return ResponseEntity.ok().build();
    }


    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    @DeleteMapping("/team/{teamId}")
    public ResponseEntity<Void> deleteTeam(@PathVariable Long teamId) {
        managementService.deleteTeam(teamId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    @DeleteMapping("/player/{playerId}")
    public ResponseEntity<Void> deletePlayer(@PathVariable Long playerId) {
        managementService.deletePlayer(playerId);
        return ResponseEntity.noContent().build();
    }
}