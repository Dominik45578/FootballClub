package com.polibuda.footballclub.gateway.service;

import com.polibuda.footballclub.gateway.redis.RedisToken;
import com.polibuda.footballclub.gateway.redis.RedisTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisTokenServiceImpl implements RedisTokenService {

    private final RedisTokenRepository tokenRepository;

    @Override
    public Mono<Void> blockToken(RedisToken redisToken) {
        return tokenRepository.save(redisToken)
                .doOnSuccess(v -> log.info("Zablokowano token: user={}, reason={}",
                        redisToken.getUserId(), redisToken.getReason()));
    }

    @Override
    public Mono<Boolean> isTokenBlocked(String tokenValue) {
        return tokenRepository.existsByToken(tokenValue);
    }

    @Override
    public Mono<Void> unblockAllTokensForUser(String userId) {
        return tokenRepository.findTokenKeysByUserId(userId)
                .collectList()
                .flatMap(keys -> {
                    if (keys.isEmpty()) return Mono.empty();
                    return tokenRepository.deleteTokensAndIndex(userId, reactor.core.publisher.Flux.fromIterable(keys));
                })
                .doOnSuccess(v -> log.info("Wyczyszczono tokeny dla usera: {}", userId));
    }

    @Override
    public Mono<RedisToken> findBlockedToken(String token) {
        return tokenRepository.findBlockedToken(token);
    }
}