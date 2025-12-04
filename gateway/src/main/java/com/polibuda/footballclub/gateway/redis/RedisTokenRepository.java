package com.polibuda.footballclub.gateway.redis;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface RedisTokenRepository {
    Mono<Void> save(RedisToken token);
    Mono<Boolean> existsByToken(String tokenValue);
    Flux<String> findTokenKeysByUserId(String userId);
    Mono<RedisToken> findBlockedToken(String token);
    Mono<Void> deleteTokensAndIndex(String userId, Flux<String> tokenKeys);
}