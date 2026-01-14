package com.polibuda.footballclub.identify.controller;

import com.polibuda.footballclub.common.UserRole;
import com.polibuda.footballclub.common.claims.MutationHeaderClaims;
import com.polibuda.footballclub.common.dto.UpdateUserRoleRequestDTO;
import com.polibuda.footballclub.common.dto.UserResponseDTO;
import com.polibuda.footballclub.identify.service.AdminSerwis;
import com.polibuda.footballclub.identify.service.UserRoleManageService;
import com.polibuda.identify.grpc.RoleAssignmentStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("auth/admin")
@PreAuthorize("hasAnyRole( 'ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminSerwis adminSerwis;
    private final UserRoleManageService userRoleManageService;

    @PatchMapping("/block")
    public ResponseEntity<String> blockUser(@RequestParam Long userId,
        @RequestHeader(MutationHeaderClaims.X_USER_ID) Long requesterId
    ) {
        if(userId.equals(requesterId)){
            return ResponseEntity.badRequest().body("""
                    {"error":"user cannot block himself"}
                    
                    """);
        }
        boolean isBlocked = adminSerwis.blockUser(userId);

        if (isBlocked) {
            return ResponseEntity.ok("""
                    {"success":"User was successfully blocked"}
                    """);
        } else {
            // Używamy .body() ponieważ badRequest() zwraca BodyBuilder
            return ResponseEntity.badRequest().body("""
                    {"error":"unexpected error was occurred during this operation}
                    """);
        }
    }

    /**
     * Endpoint do odblokowywania użytkownika.
     */
    @PatchMapping("/unblock")
    public ResponseEntity<String> unblockUser(@RequestParam Long userId,@RequestHeader(MutationHeaderClaims.X_USER_ID) Long requesterId) {
        if(userId.equals(requesterId)){
            return ResponseEntity.badRequest().body("""
                    {"error":"user cannot unlock himself
                    """);
        }
        boolean isBlocked = adminSerwis.unlockUser(userId);

        if (isBlocked) {
            return ResponseEntity.ok("""
                    {"success":"User was successfully unlocked"}
                    """);
        } else {
            // Używamy .body() ponieważ badRequest() zwraca BodyBuilder
            return ResponseEntity.badRequest().body("""
                    {"error":"unexpected error was occurred during this operation}
                    """);
        }
    }
    @PatchMapping("/role/update")
    public ResponseEntity<String> changeUserRoles(
            @RequestHeader(MutationHeaderClaims.X_USER_ID) Long userId,
            @RequestBody UpdateUserRoleRequestDTO request
    ){
        UserRoleManageService.RoleAssignmentResult success =  userRoleManageService.grantRolesToUser(request.getUserId(), request.getRoles());
        if (success.status() == RoleAssignmentStatus.SUCCESS) {
            return ResponseEntity.ok("""
                    {"success":"User roles was successfully updated"}
                    """);
        } else {
            return ResponseEntity.badRequest().body("""
                    {"error":"unexpected error was occurred during this operation}
                    """);
        }
    }

    @DeleteMapping("/role/del")
    public ResponseEntity<String> delUserRoles(
            @RequestHeader(MutationHeaderClaims.X_USER_ID) Long userId,
            @RequestBody UpdateUserRoleRequestDTO request
    ){
        if(userId.equals(request.getUserId()) && request.getRoles().contains(UserRole.ROLE_ADMIN.name())){
            return ResponseEntity.badRequest().body("""
                    {"error":"user cannot remove his root roles himself
                    """);
        }
        UserRoleManageService.RoleAssignmentResult success =  userRoleManageService.removeRolesFromUser(request.getUserId(), request.getRoles());
        if (success.status() == RoleAssignmentStatus.SUCCESS) {
            return ResponseEntity.ok("""
                    {"success":"User roles was successfully updated"}
                    """);
        } else {
            return ResponseEntity.badRequest().body("""
                    {"error":"unexpected error was occurred during this operation}
                    """);
        }
    }
}
