package com.polibuda.footballclub.gateway.filters;

import com.polibuda.footballclub.common.actions.UserTokenActions;
import com.polibuda.footballclub.common.claims.MutationHeaderClaims;
import com.polibuda.footballclub.gateway.model.UserContext;
import com.polibuda.footballclub.gateway.properties.GatewayAuthProperties;
import com.polibuda.footballclub.gateway.redis.RedisToken;
import com.polibuda.footballclub.gateway.service.RedisRequestCounterService;
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
import org.springframework.security.oauth2.jwt.Jwt;
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
    private final RedisRequestCounterService requestCounterService;
    private final GatewayAuthProperties gatewayAuthProperties;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return exchange.getPrincipal()
                .switchIfEmpty(Mono.just(new UnauthenticatedPrincipal()))
                .flatMap(principal -> {
                    if (principal instanceof JwtAuthenticationToken jwtToken) {
                        return processAuthenticatedUser(exchange, chain, jwtToken);
                    }
                    // Użytkownik anonimowy - przepuszczamy dalej
                    return chain.filter(exchange);
                });
    }

    /**
     * Główny łańcuch przetwarzania użytkownika zalogowanego.
     * Każdy krok musi być asynchroniczny (Mono).
     */
    /**
     * Główny łańcuch przetwarzania użytkownika zalogowanego.
     */
    private Mono<Void> processAuthenticatedUser(ServerWebExchange exchange, GatewayFilterChain chain, JwtAuthenticationToken token) {
        Jwt jwt = token.getToken();
        String userId = jwt.getSubject();
        String rawToken = jwt.getTokenValue();

        // 1. Próbujemy pobrać zablokowany token z Redisa
        return redisTokenService.findBlockedToken(rawToken)
                .flatMap(blockedToken -> {
                    if (UserTokenActions.TOKEN_BLOCKED_BY_LOGOUT.equals(blockedToken.getReason())) {
                        log.warn("User tried to use logged-out token: {}", userId);
                        return responseHelper.writeError(exchange, HttpStatus.UNAUTHORIZED,
                                "Session Expired", "You must log in again.");
                    }

                    // Każdy inny powód (np. ban administracyjny)
                    log.warn("Token blocked for user: {}. Reason: {}", userId, blockedToken.getReason());
                    return responseHelper.writeError(exchange, HttpStatus.UNAUTHORIZED,
                            "Token Error", "This token is blocked!");
                })
                .switchIfEmpty(Mono.defer(() -> {

                    return checkRateLimitAndIncrement(exchange, userId)
                            .flatMap(rateLimitPassed -> {
                                if (!Boolean.TRUE.equals(rateLimitPassed)) {
                                    return Mono.empty();
                                }
                                return validateAndMutateRequest(exchange, chain, token);
                            });
                }));
    }

    /**
     * Atomowe sprawdzenie i inkrementacja licznika.
     * Zwraca Mono<Boolean> - true jeśli OK, błąd HTTP jeśli limit przekroczony.
     */
    private Mono<Boolean> checkRateLimitAndIncrement(ServerWebExchange exchange, String userId) {
        // Zamiast get() + increment(), robimy tylko increment().
        // Redis zwróci nową wartość. Jeśli > limit, to błąd.
        return requestCounterService.incrementRequestCounter(userId)
                .flatMap(currentCount -> {
                    if (currentCount > gatewayAuthProperties.getMaxAllowedRequestPerRoute()) {
                        log.warn("Rate limit exceeded for user: {}. Count: {}", userId, currentCount);
                        // Zwracamy Mono.error lub obsługujemy błąd od razu, przerywając łańcuch
                        return responseHelper.writeError(exchange, HttpStatus.FORBIDDEN, "Rate Limit", "Too many requests!")
                                .then(Mono.empty()); // Przerywamy łańcuch zwracając puste Mono<Boolean> (którego nikt nie obsłuży, bo chain się urwie)
                    }
                    return Mono.just(true);
                })
                // Ważne: switchIfEmpty tutaj nie jest potrzebny, bo increment zawsze coś zwróci
                // Ale musimy obsłużyć sytuację, gdy writeError zwrócił Mono<Void> (czyli błąd)
                .hasElement(); // Triki Reactorowe: konwersja na Boolean, ale jeśli writeError poszło, to sterowanie tam ucieknie
    }

    /**
     * Walidacja biznesowa (zablokowany, nieaktywny) i mutacja nagłówków.
     */
    private Mono<Void> validateAndMutateRequest(ServerWebExchange exchange, GatewayFilterChain chain, JwtAuthenticationToken token) {
        UserContext user;
        try {
            user = claimExtractor.extract(token.getToken());
        } catch (Exception e) {
            log.error("Failed to extract claims for token: {}", token.getToken().getSubject(), e);
            return responseHelper.writeError(exchange, HttpStatus.UNAUTHORIZED, "Token Error", "Invalid token claims structure.");
        }

        if (user == null || user.userId() == null) {
            return responseHelper.writeError(exchange, HttpStatus.UNAUTHORIZED, "Token Error", "User context missing.");
        }

        if (!user.nonBlocked()) {
            log.warn("Blocked user attempt: {}", user.username());
            return responseHelper.writeError(exchange, HttpStatus.FORBIDDEN, "Account Blocked", "Your account is suspended.");
        }

        if (!user.activated()) {
            log.warn("Inactive user attempt: {}", user.username());
            return responseHelper.writeError(exchange, HttpStatus.FORBIDDEN, "Account Inactive", "Please activate your account.");
        }

        // KROK 4: Propagacja nagłówków (Request Mutation)
        if (log.isDebugEnabled()) {
            log.debug("Forwarding request for user: {}", user.username());
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
        return 1;
    }

    private String safe(String s) {
        return s == null ? "" : s;
    }

    private static class UnauthenticatedPrincipal implements java.security.Principal {
        @Override public String getName() { return "anonymous"; }
    }
}