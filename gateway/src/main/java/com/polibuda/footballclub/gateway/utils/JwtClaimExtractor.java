package com.polibuda.footballclub.gateway.utils;

import com.polibuda.footballclub.common.claims.TokenClaims;
import com.polibuda.footballclub.gateway.model.UserContext;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class JwtClaimExtractor {

    public UserContext extract(Jwt jwt) {
        if (jwt == null) return null;

        return UserContext.builder()
                .userId(jwt.getSubject())
                .username(getString(jwt, TokenClaims.USERNAME)) // fallback to subject handled in helper
                .email(getString(jwt, TokenClaims.EMAIL))
                .activated(getBoolean(jwt, TokenClaims.ACTIVE))
                .nonBlocked(getBoolean(jwt, TokenClaims.NON_BLOCKED))
                .roles(extractSet(jwt, TokenClaims.ROLES))
                .scopes(extractSet(jwt, TokenClaims.SCOPE))
                .build();
    }

    private String getString(Jwt jwt, String claim) {
        String val = jwt.getClaimAsString(claim);
        // Jeśli brak username w claimach, bierzemy 'sub' (subject)
        if (val == null && TokenClaims.USERNAME.equals(claim)) {
            return jwt.getSubject();
        }
        return val;
    }

    private boolean getBoolean(Jwt jwt, String claim) {
        Boolean val = jwt.getClaimAsBoolean(claim);
        return Boolean.TRUE.equals(val);
    }

    private Set<String> extractSet(Jwt jwt, String claim) {
        Object val = jwt.getClaims().get(claim);
        if (val instanceof Collection<?>) {
            return ((Collection<?>) val).stream().map(Object::toString).collect(Collectors.toSet());
        } else if (val instanceof String s) {
            return Set.of(s.split(" ")); // Obsługa scope jako string "openid profile"
        }
        return Collections.emptySet();
    }
}