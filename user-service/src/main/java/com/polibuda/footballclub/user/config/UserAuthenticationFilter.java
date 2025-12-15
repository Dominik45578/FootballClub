package com.polibuda.footballclub.user.config;

import com.polibuda.footballclub.common.claims.MutationHeaderClaims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
public class UserAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Używamy Twojej klasy stałych
        String userId = request.getHeader(MutationHeaderClaims.X_USER_ID);
        String rolesHeader = request.getHeader(MutationHeaderClaims.X_ROLES);

        if (userId != null) {
            // 1. Parsowanie ról (np. "ADMIN, COACH" -> [ROLE_ADMIN, ROLE_COACH])
            List<SimpleGrantedAuthority> authorities = parseRoles(rolesHeader);

            // 2. Tworzenie obiektu Authentication
            // Principal = userId (Long), Credentials = null (bo to Gateway uwierzytelnia)
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(Long.valueOf(userId), null, authorities);

            // 3. Wstrzyknięcie do kontekstu Springa
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private List<SimpleGrantedAuthority> parseRoles(String rolesHeader) {
        if (rolesHeader == null || rolesHeader.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(rolesHeader.split(","))
                .map(String::trim)
                // Spring Security wymaga konwencji "ROLE_NAZWA"
                // Jeśli Gateway wysyła "ADMIN", my zmieniamy na "ROLE_ADMIN"
                .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }
}