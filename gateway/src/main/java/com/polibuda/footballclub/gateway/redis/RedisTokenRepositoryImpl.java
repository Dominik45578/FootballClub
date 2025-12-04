package com.polibuda.footballclub.gateway.redis;

import com.polibuda.footballclub.common.actions.UserTokenActions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Slf4j
@Repository // Spring wykryje to jako bean
@RequiredArgsConstructor
public class RedisTokenRepositoryImpl implements RedisTokenRepository {

    private final ReactiveRedisTemplate<String, RedisToken> redisTemplate;

    private static final String TOKEN_KEY_PREFIX = "blocked_token:";
    private static final String USER_IDX_PREFIX = "user_blocked_idx:";

    @Override
    public Mono<Void> saveToken(Jwt jwt, UserTokenActions reason) {
        String tokenValue = jwt.getTokenValue();
        String userId = jwt.getSubject();
        long ttlSeconds = RedisToken.calcTtl(jwt.getExpiresAt());

        RedisToken redisToken = RedisToken.builder()
                .token(tokenValue)
                .userId(userId)
                .userTokenActions(reason)
                .timeToLive(ttlSeconds)
                .build();

        String tokenKey = TOKEN_KEY_PREFIX + tokenValue;
        String userIndexKey = USER_IDX_PREFIX + userId;

        // 1. Zapisz Token
        Mono<Boolean> saveOp = redisTemplate.opsForValue()
                .set(tokenKey, redisToken, Duration.ofSeconds(ttlSeconds));

        // 2. Zaktualizuj Indeks Usera (dodaj token do setu)
        Mono<Long> indexOp = redisTemplate.opsForSet().add(userIndexKey, redisToken)
                .flatMap(success -> redisTemplate.expire(userIndexKey, Duration.ofDays(7)).thenReturn(success));

        return Mono.when(saveOp, indexOp).then();
    }

    @Override
    public Mono<Boolean> isTokenBlocked(String tokenValue) {
        return redisTemplate.hasKey(TOKEN_KEY_PREFIX + tokenValue);
    }

    @Override
    public Flux<String> findTokensByUserId(String userId) {
        // Zwraca klucze tokenów (np. "blocked_token:eyJ...")
        return redisTemplate.opsForSet().members(USER_IDX_PREFIX + userId)
                .map(token -> TOKEN_KEY_PREFIX + token.getToken());
    }

    @Override
    public Mono<Void> deleteTokensAndIndex(String userId, Flux<String> tokenKeys) {
        // 1. Usuń tokeny fizycznie
        Mono<Long> deleteTokens = tokenKeys.collectList()
                .flatMap(keys -> keys.isEmpty() 
                        ? Mono.just(0L) 
                        : redisTemplate.delete(Flux.fromIterable(keys)));

        // 2. Usuń indeks użytkownika
        Mono<Long> deleteIndex = redisTemplate.delete(USER_IDX_PREFIX + userId);

        return Mono.when(deleteTokens, deleteIndex).then();
    }
}