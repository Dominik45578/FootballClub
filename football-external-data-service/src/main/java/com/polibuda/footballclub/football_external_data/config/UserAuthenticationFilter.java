package com.polibuda.footballclub.football_external_data.config;

import com.polibuda.footballclub.common.claims.MutationHeaderClaims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserAuthenticationFilter extends OncePerRequestFilter {

    private static final String ROLE_PREFIX = "ROLE_";

    // 1. Wstrzykujemy beana z hierarchią (Spring znajdzie go z SecurityConfig)
    private final RoleHierarchy roleHierarchy;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String userId = request.getHeader(MutationHeaderClaims.X_USER_ID);
        String rolesHeader = request.getHeader(MutationHeaderClaims.X_ROLES);

        if (userId != null) {
            try {
                // Logika przeniesiona bezpośrednio do metody instancyjnej
                authenticateUser(userId, rolesHeader);
            } catch (Exception e) {
                log.error("Failed to set user authentication based on gateway headers. UserID: {}", userId, e);
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }

    private void authenticateUser(String userId, String rolesHeader) {
        // 1. Pobieramy "surowe" role z nagłówka (np. tylko ADMIN)
        Collection<GrantedAuthority> rawAuthorities = extractAuthorities(rolesHeader);

        // 2. KLUCZOWE: Obliczamy wszystkie role wynikające z hierarchii
        // (np. zamienia ADMIN na -> ADMIN, MANAGER, COACH, MEMBER...)
        Collection<? extends GrantedAuthority> effectiveAuthorities =
                roleHierarchy.getReachableGrantedAuthorities(rawAuthorities);

        Long principalId = Long.valueOf(userId);

        // 3. Tworzymy token z PEŁNĄ listą uprawnień
        PreAuthenticatedAuthenticationToken authentication =
                new PreAuthenticatedAuthenticationToken(principalId, null, effectiveAuthorities);

        authentication.setDetails("Gateway-Authenticated");

        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private List<GrantedAuthority> extractAuthorities(String rolesHeader) {
        if (rolesHeader == null || rolesHeader.isBlank()) {
            return Collections.emptyList();
        }

        return Arrays.stream(rolesHeader.split(","))
                .map(String::trim)
                .filter(role -> !role.isEmpty())
                .map(this::addRolePrefixIfNeeded)
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }

    private String addRolePrefixIfNeeded(String role) {
        return role.startsWith(ROLE_PREFIX) ? role : ROLE_PREFIX + role;
    }
}