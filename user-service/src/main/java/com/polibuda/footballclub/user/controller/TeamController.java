package com.polibuda.footballclub.user.controller;

import com.polibuda.footballclub.common.actions.TeamFetchMode;
import com.polibuda.footballclub.common.claims.MutationHeaderClaims;
import com.polibuda.footballclub.common.database.TeamStatus;
import com.polibuda.footballclub.user.dto.request.AddTeamRequest;
import com.polibuda.footballclub.user.dto.request.UpdateTeamMemberRequestDTO;
import com.polibuda.footballclub.user.dto.request.UpdateTeamRequestDTO;
import com.polibuda.footballclub.user.dto.response.restricted.TeamDetailsResponse;
import com.polibuda.footballclub.user.dto.response.summary.wrappers.TeamSearchResponse;
import com.polibuda.footballclub.user.service.team.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/user/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    /**
     * Główna wyszukiwarka zespołów.
     * Obsługuje tryby:
     * - ALL_TEAMS (domyślny): Wszystkie zespoły (z opcjonalnym filtrem ?name=...)
     * - MY_TEAMS: Zespoły, w których jestem
     * - SPECIFIC_TEAM: Konkretny zespół po ID (przekazany jako parametr)
     */
    @GetMapping
    public ResponseEntity<TeamSearchResponse> getTeams(
            @RequestHeader(MutationHeaderClaims.X_USER_ID) Long userId,
            @RequestParam(defaultValue = "ALL_TEAMS") TeamFetchMode mode,
            @RequestParam(required = false) Long teamId,
            @RequestParam(required = false) String name,
                @PageableDefault(size = 20) Pageable pageable
    ) {
        // Ułatwienie dla frontendu: Jeśli podano ID, a nie zmieniono trybu, wymuszamy tryb SPECIFIC
        if (teamId != null && mode == TeamFetchMode.ALL_TEAMS) {
            mode = TeamFetchMode.SPECIFIC_TEAM;
        }

        return ResponseEntity.ok(teamService.getTeams(mode, userId, teamId, name, pageable));
    }

    /**
     * Pobierz szczegóły konkretnego zespołu (wraz ze składem).
     * Dostęp: Każdy zalogowany (widok publiczny, choć kod zespołu może być ukryty w DTO zależnie od logiki).
     */
    @GetMapping("/{teamId}")
    public ResponseEntity<TeamDetailsResponse> getTeamDetails(@PathVariable Long teamId) {
        return teamService.getTeamDetails(teamId) == null ? ResponseEntity.status(HttpStatus.NOT_FOUND).build() : ResponseEntity.ok(teamService.getTeamDetails(teamId));
    }
    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    @DeleteMapping("/del/{teamId}")
    public ResponseEntity<Void> deleteTeam(@PathVariable Long teamId
    ,@RequestHeader(MutationHeaderClaims.X_USER_ID) Long userId
    ) {
        return teamService.deleteTeam(teamId,userId) ?  ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    @PutMapping("/new")
    public ResponseEntity<Void> addTeam(
                                        @RequestBody AddTeamRequest request) {
        return teamService.addTeam(request) ?  ResponseEntity.ok().build() : ResponseEntity.badRequest().build();
    }

    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    @PatchMapping("/update")
    public ResponseEntity<Boolean> updateTeam(
            @RequestBody UpdateTeamRequestDTO request,
           @RequestHeader(MutationHeaderClaims.X_USER_ID) Long userId
            ){
        return teamService.updateTeam(request,userId) ? ResponseEntity.ok().build() : ResponseEntity.badRequest().build();
    }

    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    @PatchMapping("/membership/update")
    public ResponseEntity<Boolean> updateMembership(
            @RequestBody UpdateTeamMemberRequestDTO request,
            @RequestHeader(MutationHeaderClaims.X_USER_ID) Long userId
    ){
        return teamService.updateMembership(request, userId)?ResponseEntity.ok().build() : ResponseEntity.badRequest().build();
    }

}