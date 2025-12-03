package com.polibuda.footballclub.gateway.filters;

import com.polibuda.footballclub.common.claims.MutationHeaderClaims;
import com.polibuda.footballclub.gateway.model.UserContext;
import com.polibuda.footballclub.gateway.properties.GatewayAuthProperties;
import com.polibuda.footballclub.gateway.service.RedisTokenService;
import com.polibuda.footballclub.gateway.utils.JwtClaimExtractor;
import com.polibuda.footballclub.gateway.utils.WebFluxResponseHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserValidationGlobalFilter implements GlobalFilter, Ordered {

    private final JwtClaimExtractor claimExtractor;
    private final WebFluxResponseHelper responseHelper;
    private final RedisTokenService redisTokenService;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return exchange.getPrincipal()
                // Jeśli brak principala (np. endpoint publiczny), idź dalej
                .switchIfEmpty(Mono.just(new UnauthenticatedPrincipal()))
                .flatMap(principal -> {
                    if (principal instanceof JwtAuthenticationToken jwtToken) {
                        return processAuthenticatedUser(exchange, chain, jwtToken);
                    }
                    // Anonymous user -> forward request
                    return chain.filter(exchange);
                });
    }

    private Mono<Void> processAuthenticatedUser(ServerWebExchange exchange, GatewayFilterChain chain, JwtAuthenticationToken token) {
        if(redisTokenService.isTokenBlocked(token.getToken())){
            log.error("Token is blocked!");
            return responseHelper.writeError(exchange, HttpStatus.UNAUTHORIZED, "Token Error", "This token is blocked!");
        }


        UserContext user = claimExtractor.extract(token.getToken());

        if (user == null || user.userId() == null || Long.parseLong(user.userId()) < 0) {
            log.error("Token valid signature but failed to extract claims.");
            return responseHelper.writeError(exchange, HttpStatus.UNAUTHORIZED, "Token Error", "Invalid token claims structure.");
        }

        if (!user.nonBlocked()) {
            log.warn("Blocked user attempt: {}", user.username());
            return responseHelper.writeError(exchange, HttpStatus.FORBIDDEN, "Account Blocked", "Your account is suspended. Contact support.");
        }

        if (!user.activated()) {
            log.warn("Inactive user attempt: {}", user.username());
            return responseHelper.writeError(exchange, HttpStatus.FORBIDDEN, "Account Inactive", "Please activate your account via email link.");
        }

        // --- 2. Propagacja Nagłówków (Mutation) ---
        if (log.isDebugEnabled()) {
            log.debug("Forwarding request for user: {} [{}]", user.username(), user.roles());
        }

        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                .header(MutationHeaderClaims.X_USER_ID, safe(user.userId()))
                .header(MutationHeaderClaims.X_USERNAME, safe(user.username()))
                .header(MutationHeaderClaims.X_EMAIL, safe(user.email()))
                .header(MutationHeaderClaims.X_ROLES, String.join(",", user.roles()))
                .header(MutationHeaderClaims.X_SCOPE, String.join(" ", user.scopes()))
                .header(MutationHeaderClaims.X_NON_BLOCKED, String.valueOf(user.nonBlocked()))
                .header(MutationHeaderClaims.X_ACTIVATED, String.valueOf(user.activated()))
                .build();

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    @Override
    public int getOrder() {
        // Kolejność: Musi być PO filtrach Security (Authentication), ale PRZED routingiem
        return 1;
    }

    private String safe(String s) {
        return s == null ? "" : s;
    }

    // Klasa markerowa do obsługi switchIfEmpty
    private static class UnauthenticatedPrincipal implements java.security.Principal {
        @Override public String getName() { return "anonymous"; }
    }
}