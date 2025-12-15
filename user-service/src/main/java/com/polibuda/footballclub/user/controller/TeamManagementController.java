package com.polibuda.footballclub.user.controller;

import com.polibuda.footballclub.common.claims.MutationHeaderClaims;
import com.polibuda.footballclub.user.dto.request.JoinTeamRequest;
import com.polibuda.footballclub.user.dto.request.ManualAddMemberRequest;
import com.polibuda.footballclub.user.service.teamMember.TeamMemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user/team-management")
@RequiredArgsConstructor
public class TeamManagementController {

    private final TeamMemberService teamMemberService;

    /**
     * Akcja Gracza: Dołącz do zespołu (wymaga Kodu).
     * Dostęp: Każdy zalogowany.
     */
    @PostMapping("/join")
    public ResponseEntity<Void> joinTeam(
            @RequestHeader(MutationHeaderClaims.X_USER_ID) Long userId,
            @RequestBody @Valid JoinTeamRequest request) {
        teamMemberService.joinTeam(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /**
     * Akcja Trenera: Zatwierdź gracza (zmienia status WAITING -> ACTIVE).
     * Dostęp: Tylko COACH lub ADMIN (dodatkowa weryfikacja "czy to mój zespół" w serwisie).
     */
    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    @PostMapping("/{teamMemberId}/approve")
    public ResponseEntity<Void> approveMember(
            @RequestHeader(MutationHeaderClaims.X_USER_ID) Long userId,
            @PathVariable Long teamMemberId) {
        teamMemberService.approveMember(userId, teamMemberId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Akcja Trenera: Odrzuć aplikację LUB Wyrzuć gracza (zmienia status lub usuwa).
     * Dostęp: Tylko COACH lub ADMIN.
     */
    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    @DeleteMapping("/{teamMemberId}")
    public ResponseEntity<Void> removeMember(
            @RequestHeader(MutationHeaderClaims.X_USER_ID) Long userId,
            @PathVariable Long teamMemberId) {
        teamMemberService.rejectOrRemoveMember(userId, teamMemberId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Akcja Trenera: Dodaj gracza ręcznie (bez kodu, od razu ACTIVE).
     * Wymaga podania ID zespołu w ścieżce i ID usera w Body.
     * Dostęp: Tylko COACH lub ADMIN.
     */
    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    @PostMapping("/{teamId}/add-member")
    public ResponseEntity<Void> addMemberManually(
            @RequestHeader(MutationHeaderClaims.X_USER_ID) Long userId,
            @PathVariable Long teamId,
            @RequestBody @Valid ManualAddMemberRequest request) {
        teamMemberService.addMemberManually(userId, teamId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}