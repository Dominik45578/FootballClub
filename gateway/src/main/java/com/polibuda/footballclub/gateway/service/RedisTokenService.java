package com.polibuda.footballclub.gateway.service;

import com.polibuda.footballclub.gateway.redis.RedisToken;
import reactor.core.publisher.Mono;

public interface RedisTokenService {
    Mono<Void> blockToken(RedisToken redisToken); // Zmiana sygnatury!
    Mono<Boolean> isTokenBlocked(String tokenValue); // String, a nie Jwt
    Mono<Void> unblockAllTokensForUser(String userId);
    Mono<RedisToken> findBlockedToken(String token);
}