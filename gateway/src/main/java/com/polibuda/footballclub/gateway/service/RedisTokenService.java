package com.polibuda.footballclub.gateway.service;

import com.polibuda.footballclub.common.actions.UserTokenActions;
import org.springframework.security.oauth2.jwt.Jwt;
import reactor.core.publisher.Mono; // Ważny import

public interface RedisTokenService {

    // Zmiana z boolean na Mono<Boolean> jest KONIECZNA w Gateway
    Mono<Boolean> isTokenBlocked(Jwt jwt);

    // To może zostać void, jeśli jest "fire-and-forget",
    // ale lepiej Mono<Void> żeby wiedzieć czy zapis się udał
    Mono<Void> blockToken(Jwt jwt, UserTokenActions reason);

    Mono<Void> unblockAllTokensForUser(String userId);
}