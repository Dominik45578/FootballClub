package com.polibuda.footballclub.gateway.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisRequestServiceImpl implements RedisRequestCounterService {

    private final ReactiveRedisTemplate<String, String> reactiveRedisTemplate;
    private static final String KEY_PREFIX = "RequestCount:";

    @Override
    public Mono<Long> incrementRequestCounter(String userId) {
        String key = KEY_PREFIX + userId;

        // 1. Inkrementacja (Atomic)
        return reactiveRedisTemplate.opsForHash().increment(key, "requestCount", 1)
                .flatMap(count -> {
                    // 2. Logika inicjalizacji dla nowego wpisu (gdy licznik == 1)
                    if (count == 1) {
                        // Tworzymy zadanie: Dodaj ID do hasha
                        Mono<Boolean> addIdOp = reactiveRedisTemplate.opsForHash().put(key, "id", userId);

                        // Tworzymy zadanie: Ustaw TTL
                        Mono<Boolean> expireOp = reactiveRedisTemplate.expire(key, Duration.ofHours(1));

                        return Mono.when(addIdOp, expireOp)
                                .thenReturn(count);
                    }

                    return Mono.just(count);
                })
                .doOnError(e -> log.error("Błąd Redisa dla usera: {}", userId, e));
    }

    @Override
    public Mono<Integer> getRequestCount(String userId) {
        String key = KEY_PREFIX + userId;
        return reactiveRedisTemplate.opsForHash().get(key, "requestCount")
                .map(obj -> Integer.parseInt(obj.toString()))
                .switchIfEmpty(Mono.just(0));
    }
}