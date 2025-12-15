package com.polibuda.footballclub.user.controller;

import com.polibuda.footballclub.common.claims.MutationHeaderClaims;
import com.polibuda.footballclub.user.dto.request.UpdateMemberProfileRequest;
import com.polibuda.footballclub.user.dto.response.restricted.MemberProfileResponse;
import com.polibuda.footballclub.user.dto.response.summary.MemberSummaryResponse;
import com.polibuda.footballclub.user.dto.response.summary.wrappers.MemberSearchResponse;
import com.polibuda.footballclub.user.service.member.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    /**
     * Pobierz MÓJ profil (pełne dane z Peselem).
     * Dostęp: Każdy zalogowany użytkownik.
     */
    @GetMapping("/me")
    public ResponseEntity<MemberProfileResponse> getMyProfile(
            @RequestHeader(MutationHeaderClaims.X_USER_ID) Long userId) {
        return ResponseEntity.ok(memberService.getMyProfile(userId));
    }

    /**
     * Zaktualizuj MÓJ profil (waga, wzrost, telefon).
     * Dostęp: Każdy zalogowany użytkownik.
     */
    @PatchMapping("/me")
    public ResponseEntity<MemberProfileResponse> updateMyProfile(
            @RequestHeader(MutationHeaderClaims.X_USER_ID) Long userId,
            @RequestBody @Valid UpdateMemberProfileRequest request) {
        return ResponseEntity.ok(memberService.updateMyProfile(userId, request));
    }

    /**
     * Wyszukaj innych użytkowników (np. żeby dodać ich do drużyny).
     * Zwraca dane okrojone (MemberSummary).
     * Dostęp: Każdy zalogowany.
     */
    @GetMapping("search")
    public ResponseEntity<MemberSearchResponse> searchMembers(
            @RequestParam String query,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(memberService.searchMembers(query, pageable));
    }
    @GetMapping
    public ResponseEntity<MemberSummaryResponse> getMemberProfile(
            @RequestParam Long id
    ){
        return ResponseEntity.ok(memberService.getMemberProfile(id));
    }
}