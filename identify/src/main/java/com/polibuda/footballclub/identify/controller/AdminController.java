package com.polibuda.footballclub.identify.controller;

import com.polibuda.footballclub.common.claims.MutationHeaderClaims;
import com.polibuda.footballclub.identify.service.AdminSerwis;
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
}
