package com.polibuda.footballclub.match.model;

import com.polibuda.footballclub.match.exceptions.InsufficientPermissionsException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
public class SecurityContextHelper {

    private static final String ROLE_ADMIN = "ROLE_ADMIN";
    private static final String ROLE_COACH = "ROLE_COACH";
    private static final String ROLE_PLAYER = "ROLE_PLAYER";

    /**
     * Pobiera ID aktualnie zalogowanego użytkownika (z tokena/nagłówka).
     */
    public Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new InsufficientPermissionsException("Brak kontekstu uwierzytelnienia (User ID)");
        }
        try {
            return (Long) auth.getPrincipal();
        } catch (ClassCastException e) {
            return Long.parseLong(auth.getPrincipal().toString());
        }
    }

    public boolean isAdmin() {
        return hasRole(ROLE_ADMIN);
    }

    public boolean isCoach() {
        return hasRole(ROLE_COACH);
    }
    
    public boolean isPlayer() {
        return hasRole(ROLE_PLAYER);
    }

    private boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().contains(new SimpleGrantedAuthority(role));
    }
}