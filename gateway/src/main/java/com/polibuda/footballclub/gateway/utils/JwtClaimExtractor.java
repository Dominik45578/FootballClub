package com.polibuda.footballclub.gateway.utils;

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
        if (jwt == null) return new UserContext(null, null, Collections.emptySet(), Collections.emptySet());


        String userId = jwt.getSubject();
        Object preferred = jwt.getClaims().getOrDefault("preferred_username", userId);
        String username = String.valueOf(preferred);


        Set<String> roles = new LinkedHashSet<>();
        Map<String, Object> realmAccess = (Map<String, Object>) jwt.getClaims().get("realm_access");
        if (realmAccess != null && realmAccess.get("roles") instanceof Collection<?> c) {
            c.forEach(r -> roles.add(r.toString()));
        }
        Object rolesClaim = jwt.getClaims().get("roles");
        if (rolesClaim instanceof Collection<?> rc) {
            rc.forEach(r -> roles.add(r.toString()));
        }


        Set<String> scopes = new LinkedHashSet<>();
        Object val = jwt.getClaims().get("scope");
        if (val instanceof String s) {
            Arrays.stream(s.split(" ")).forEach(scopes::add);
        } else {
            Object scp = jwt.getClaims().get("scp");
            if (scp instanceof Collection<?> c) {
                c.forEach(o -> scopes.add(o.toString()));
            }
        }


        return new UserContext(userId, username, Collections.unmodifiableSet(roles), Collections.unmodifiableSet(scopes));
    }
}