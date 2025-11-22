package com.polibuda.footballclub.gateway.utils;

import com.polibuda.footballclub.common.claims.TokenClaims;
import com.polibuda.footballclub.gateway.model.ClaimExtractor;
import com.polibuda.footballclub.gateway.model.UserContext;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class JwtClaimExtractor implements ClaimExtractor {

    @Override
    @SuppressWarnings("unchecked")
    public UserContext extract(Jwt jwt) {
        if (jwt == null) {
            return new UserContext(null, null, Collections.emptySet(), Collections.emptySet());
        }

        // Extract userId
        String userId = jwt.getClaimAsString(TokenClaims.USER_ID);
        if (userId == null) {
            userId = jwt.getSubject();
        }

        // Extract username
        String username = jwt.getClaimAsString(TokenClaims.USERNAME);
        if (username == null) {
            username = jwt.getSubject();
        }

        // Extract roles
        Set<String> roles = new LinkedHashSet<>();
        Object rolesClaim = jwt.getClaims().get(TokenClaims.ROLES);
        if (rolesClaim instanceof Collection<?> rc) {
            rc.forEach(r -> roles.add(r.toString()));
        } else if (rolesClaim instanceof String s) {
            roles.add(s);
        }

        // Extract scopes
        Set<String> scopes = new LinkedHashSet<>();
        Object scopeClaim = jwt.getClaims().get(TokenClaims.SCOPE);
        if (scopeClaim instanceof String s) {
            Arrays.stream(s.split(" ")).forEach(scopes::add);
        } else if (scopeClaim instanceof Collection<?> c) {
            c.forEach(o -> scopes.add(o.toString()));
        }

        return new UserContext(
                userId,
                username,
                Collections.unmodifiableSet(roles),
                Collections.unmodifiableSet(scopes)
        );
    }
}
