package com.polibuda.footballclub.user.controller;

import com.polibuda.footballclub.common.claims.MutationHeaderClaims;
import com.polibuda.footballclub.user.dto.request.NewMemberRequestDTO;
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

    @PreAuthorize("hasAnyRole('MEMBER')")
    @GetMapping("/me")
    public ResponseEntity<MemberProfileResponse> getMyProfile(
            @RequestHeader(MutationHeaderClaims.X_USER_ID) Long userId) {
        return ResponseEntity.ok(memberService.getMyProfile(userId));
    }
    @PreAuthorize("hasAnyRole('MEMBER')")
    @PatchMapping("/me")
    public ResponseEntity<MemberProfileResponse> updateMyProfile(
            @RequestHeader(MutationHeaderClaims.X_USER_ID) Long userId,
            @RequestBody @Valid UpdateMemberProfileRequest request) {
        return ResponseEntity.ok(memberService.updateMyProfile(userId, request));
    }

    @PreAuthorize("hasAnyRole('MEMBER')")
    @GetMapping("/search")
    public ResponseEntity<MemberSearchResponse> searchMembers(
            @RequestParam String query,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(memberService.searchMembers(query, pageable));
    }
    @PreAuthorize("hasAnyRole('MEMBER')")
    @GetMapping
    public ResponseEntity<MemberSummaryResponse> getMemberProfile(
            @RequestParam Long id
    ){
        return ResponseEntity.ok(memberService.getMemberProfile(id));
    }

    @PreAuthorize("hasAnyRole('MEMBER')")
    @GetMapping("/get/{memberId}")
    public ResponseEntity<MemberSummaryResponse> getMemberProfileById(
            @PathVariable Long memberId
    ){
        return ResponseEntity.ok(memberService.getMemberProfileById(memberId));
    }


    @PutMapping("/join")
    public ResponseEntity<Boolean> addNewMember(
           @Valid  @RequestBody(required = true) NewMemberRequestDTO request,
            @RequestHeader(MutationHeaderClaims.X_USER_ID) Long userId
    ){
        return memberService.addMember(request,userId);
    }

    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    @DeleteMapping("/del")
    public ResponseEntity<Boolean> deleteMember(
            @RequestHeader(MutationHeaderClaims.X_USER_ID) Long userId
    ){
        return memberService.removeMember(userId);
    }
}