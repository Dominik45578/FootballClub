package com.polibuda.footballclub.gateway.utils;

import com.polibuda.footballclub.common.claims.TokenClaims;
import com.polibuda.footballclub.gateway.model.ClaimExtractor;
import com.polibuda.footballclub.gateway.model.UserContext;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class JwtClaimExtractor implements ClaimExtractor {

    private String getStringClaim(String claimName, Jwt jwt) {
        String subject = jwt.getClaimAsString(claimName);
        return subject == null ? jwt.getSubject() : subject;
    }

    private boolean getBooleanClaims(String claimName, Jwt jwt) {
        return   jwt.getClaimAsBoolean(claimName);
    }

    @Override
    @SuppressWarnings("unchecked")
    public UserContext extract(Jwt jwt) {
        if (jwt == null) {
            return new UserContext(null, null,null, Collections.emptySet(), Collections.emptySet(), false , false);
        }


        String userId = getStringClaim(TokenClaims.USER_ID, jwt);

        String username = getStringClaim(TokenClaims.USERNAME, jwt);

        String email = getStringClaim(TokenClaims.EMAIL, jwt);

        boolean blocked = getBooleanClaims(TokenClaims.BLOCKED, jwt);
        boolean active = getBooleanClaims(TokenClaims.ACTIVE, jwt);

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

        return UserContext.builder()
                .userId(userId)
                .username(username)
                .email(email)
                .roles(Collections.unmodifiableSet(roles))
                .scopes(Collections.unmodifiableSet(scopes))
                .blocked(blocked)
                .activated(active)
                .build();
        }
}

