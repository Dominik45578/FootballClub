package com.polibuda.footballclub.match.controller;

import com.polibuda.footballclub.match.dto.request.CreateMatchRequestDTO;
import com.polibuda.footballclub.match.dto.request.UpdateMatchRequestDTO;
import com.polibuda.footballclub.match.dto.response.wrappers.MatchResponseDTO;
import com.polibuda.footballclub.match.service.match.MatchManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/match")
@RequiredArgsConstructor
public class MatchController {

    private final MatchManagementService matchService;

    // --- ENDPOINTY DO ODCZYTU (GET) ---

    @GetMapping("/all")
    public ResponseEntity<Page<MatchResponseDTO>> getAllMatches( @PageableDefault(size = 20) Pageable pageable) {
        Page<MatchResponseDTO> matches = matchService.getAllMatches(pageable);
        return ResponseEntity.ok(matches);
    }
    /**
     * Pobiera szczegóły konkretnego meczu.
     * GET /api/v1/matches/{matchId}
     */
    @GetMapping("/{matchId}")
    public ResponseEntity<MatchResponseDTO> getMatchById(@PathVariable Long matchId) {
        log.debug("REST request to get match with id: {}", matchId);
        MatchResponseDTO response = matchService.getMatchById(matchId);
        return ResponseEntity.ok(response);
    }

    /**
     * Pobiera listę meczów dla zalogowanego użytkownika (na podstawie jego drużyn).
     * GET /api/v1/matches/my-matches?page=0&size=10
     */
    @GetMapping("/my-matches")
    public ResponseEntity<Page<MatchResponseDTO>> getMyMatches(
            @PageableDefault(sort = "matchDate", direction = Sort.Direction.ASC) Pageable pageable) {
        log.debug("REST request to get matches for current user");
        Page<MatchResponseDTO> response = matchService.getMyMatches(pageable);
        return ResponseEntity.ok(response);
    }

    /**
     * Pobiera listę meczów dla konkretnego zespołu (np. publiczny terminarz).
     * GET /api/v1/matches/team/{teamId}?page=0&size=10
     */
    @GetMapping("/team/{teamId}")
    public ResponseEntity<Page<MatchResponseDTO>> getMatchesByTeamId(
            @PathVariable Long teamId,
            @PageableDefault(sort = "matchDate", direction = Sort.Direction.ASC) Pageable pageable) {
        log.debug("REST request to get matches for team id: {}", teamId);
        Page<MatchResponseDTO> response = matchService.getMatchesByTeamId(teamId, pageable);
        return ResponseEntity.ok(response);
    }

    // --- ENDPOINTY DO ZARZĄDZANIA (POST, PATCH, DELETE) ---

    /**
     * Tworzy nowy mecz.
     * Wymaga uprawnień trenera lub admina (weryfikowane w serwisie).
     * POST /api/v1/matches
     */
    @PostMapping
    public ResponseEntity<MatchResponseDTO> createMatch(@Valid @RequestBody CreateMatchRequestDTO request) {
        log.info("REST request to create match for internal team: {}", request.getInternalTeamId());
        MatchResponseDTO response = matchService.createMatch(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Aktualizuje istniejący mecz (zmiana daty, statusu, gospodarza).
     * PATCH /api/v1/matches/{matchId}
     */
    @PatchMapping("/{matchId}")
    public ResponseEntity<MatchResponseDTO> updateMatch(
            @PathVariable Long matchId,
            @Valid @RequestBody UpdateMatchRequestDTO request) {
        log.info("REST request to update match id: {}", matchId);
        MatchResponseDTO response = matchService.updateMatch(matchId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Usuwa mecz.
     * DELETE /api/v1/matches/{matchId}
     */
    @DeleteMapping("/{matchId}")
    public ResponseEntity<Void> deleteMatch(@PathVariable Long matchId) {
        log.info("REST request to delete match id: {}", matchId);
        matchService.deleteMatch(matchId);
        return ResponseEntity.noContent().build();
    }
}