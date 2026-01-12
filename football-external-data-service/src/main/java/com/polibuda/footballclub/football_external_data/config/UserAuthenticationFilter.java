package com.polibuda.footballclub.football_external_data.config;

import com.polibuda.footballclub.common.claims.MutationHeaderClaims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Component
public class UserAuthenticationFilter extends OncePerRequestFilter {

    private static final String ROLE_PREFIX = "ROLE_";

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String userId = request.getHeader(MutationHeaderClaims.X_USER_ID);
        String rolesHeader = request.getHeader(MutationHeaderClaims.X_ROLES);

        if (userId != null) {
            try {
                AuthenticationContextBuilder.setAuthentication(userId, rolesHeader);
            } catch (Exception e) {
                log.error("Failed to set user authentication based on gateway headers", e);
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }

    private static class AuthenticationContextBuilder {

        static void setAuthentication(String userId, String rolesHeader) {
            List<SimpleGrantedAuthority> authorities = extractAuthorities(rolesHeader);
            Long principalId = Long.valueOf(userId);

            PreAuthenticatedAuthenticationToken authentication =
                    new PreAuthenticatedAuthenticationToken(principalId, null, authorities);

            authentication.setDetails("Gateway-Authenticated");

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        private static List<SimpleGrantedAuthority> extractAuthorities(String rolesHeader) {
            return Optional.ofNullable(rolesHeader)
                    .filter(header -> !header.isBlank())
                    .stream()
                    .flatMap(header -> Arrays.stream(header.split(",")))
                    .map(String::trim)
                    .filter(role -> !role.isEmpty())
                    .map(AuthenticationContextBuilder::addRolePrefixIfNeeded)
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());
        }

        private static String addRolePrefixIfNeeded(String role) {
            return role.startsWith(ROLE_PREFIX) ? role : ROLE_PREFIX + role;
        }
    }
}