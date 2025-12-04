package com.polibuda.footballclub.gateway.redis;

import com.polibuda.footballclub.common.actions.UserTokenActions;
import org.springframework.security.oauth2.jwt.Jwt;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface RedisTokenRepository {

    // Zapis z logiką wygasania
    Mono<Void> saveToken(Jwt jwt, UserTokenActions reason);

    // Sprawdzenie czy istnieje
    Mono<Boolean> isTokenBlocked(String tokenValue);

    // Pobranie wszystkich tokenów usera (do usunięcia)
    Flux<String> findTokensByUserId(String userId);

    // Usunięcie konkretnych tokenów
    Mono<Void> deleteTokensAndIndex(String userId, Flux<String> tokenKeys);
}