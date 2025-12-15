package com.polibuda.footballclub.gateway.redis;

import com.polibuda.footballclub.common.actions.UserTokenActions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Repository
@RequiredArgsConstructor
public class RedisTokenRepositoryImpl implements RedisTokenRepository {

    private final ReactiveRedisTemplate<String, String> redisTemplate;

    private static final String TOKEN_PREFIX = "blocked_token:";
    private static final String USER_IDX_PREFIX = "user_blocked_idx:";

    @Override
    public Mono<Void> save(RedisToken token) {
        String tokenKey = TOKEN_PREFIX + token.getToken();
        String userIndexKey = USER_IDX_PREFIX + token.getUserId();
        Duration ttl = Duration.ofSeconds(token.getTimeToLive());

        // 1. Mapowanie Obiekt -> Hash Map
        Map<String, String> hashData = new HashMap<>();
        hashData.put("userId", token.getUserId());
        hashData.put("reason", token.getReason().name());
        hashData.put("blockedAt", String.valueOf(token.getBlockedAt()));
        // Możemy dodać więcej pól, jeśli chcemy

        // 2. Operacje na Tokenie (Zapis Hasha + TTL)
        Mono<Boolean> tokenOps = redisTemplate.opsForHash().putAll(tokenKey, hashData)
                .then(redisTemplate.expire(tokenKey, ttl));

        // 3. Operacje na Indeksie (Zapis do Setu + TTL)
        Mono<Long> indexOps = redisTemplate.opsForSet().add(userIndexKey, token.getToken())
                .flatMap(success -> redisTemplate.expire(userIndexKey, Duration.ofDays(7)).thenReturn(success));

        // Wykonaj równolegle
        return Mono.when(tokenOps, indexOps).then();
    }

    @Override
    public Mono<Boolean> existsByToken(String tokenValue) {
        return redisTemplate.hasKey(TOKEN_PREFIX + tokenValue);
    }

    @Override
    public Flux<String> findTokenKeysByUserId(String userId) {
        return redisTemplate.opsForSet().members(USER_IDX_PREFIX + userId)
                .map(tokenVal -> TOKEN_PREFIX + tokenVal);
    }

    @Override
    public Mono<RedisToken> findBlockedToken(String tokenValue) {
        String key = TOKEN_PREFIX + tokenValue;

        // opsForHash().entries(key) zwraca Flux<Map.Entry<K, V>> (strumień pól)
        // Musimy to zebrać do jednej Mapy, a potem zamienić na obiekt
        return redisTemplate.opsForHash().entries(key)
                .collectMap(e -> (String) e.getKey(), e -> (String) e.getValue())
                .flatMap(map -> {
                    if (map.isEmpty()) {
                        return Mono.empty();
                    }

                    // Ręczne mapowanie z Map<String, String> na obiekt RedisToken
                    try {
                        RedisToken redisToken = RedisToken.builder()
                                .token(tokenValue) // Tokena nie ma w środku hasha (jest w kluczu), więc bierzemy z argumentu
                                .userId(map.get("userId"))
                                .reason(UserTokenActions.valueOf(map.get("reason"))) // Parsowanie Enuma
                                .blockedAt(Long.parseLong(map.get("blockedAt")))     // Parsowanie Longa
                                // TTL nie jest przechowywany w Hashu (jest metadaną klucza),
                                // opcjonalnie można go pobrać osobno przez redisTemplate.getExpire(key),
                                // ale zazwyczaj w obiekcie zwracanym nie jest kluczowy.
                                .build();

                        return Mono.just(redisToken);
                    } catch (Exception e) {
                        log.error("Błąd mapowania tokena z Redis: {}", tokenValue, e);
                        return Mono.empty();
                    }
                });
    }

    @Override
    public Mono<Void> deleteTokensAndIndex(String userId, Flux<String> tokenKeys) {
        Mono<Long> deleteTokens = tokenKeys.collectList()
                .flatMap(keys -> keys.isEmpty()
                        ? Mono.just(0L)
                        : redisTemplate.delete(Flux.fromIterable(keys)));

        Mono<Long> deleteIndex = redisTemplate.delete(USER_IDX_PREFIX + userId);

        return Mono.when(deleteTokens, deleteIndex).then();
    }
}