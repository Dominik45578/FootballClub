package com.polibuda.footballclub.gateway.model;

import lombok.Builder;
import java.util.Set;

@Builder
public record UserContext(
        String userId,
        String username,
        String email,
        Set<String> roles,
        Set<String> scopes,
        boolean activated,
        boolean nonBlocked
) {}