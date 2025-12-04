package com.polibuda.footballclub.gateway.service;

import com.polibuda.footballclub.common.actions.UserTokenActions;
import com.polibuda.footballclub.gateway.redis.RedisTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisTokenServiceImpl implements RedisTokenService {

    // Wstrzykujemy NASZ interfejs repozytorium
    private final RedisTokenRepository tokenRepository;

    @Override
    public Mono<Void> blockToken(Jwt jwt, UserTokenActions reason) {
        return tokenRepository.saveToken(jwt, reason)
                .doOnSuccess(v -> log.info("Token zablokowany: user={}, reason={}", jwt.getSubject(), reason));
    }

    @Override
    public Mono<Boolean> isTokenBlocked(Jwt jwt) {
        return tokenRepository.isTokenBlocked(jwt.getTokenValue())
                .doOnNext(blocked -> {
                    if (blocked) log.warn("Wykryto zablokowany token: {}", jwt.getSubject());
                });
    }

    @Override
    public Mono<Void> unblockAllTokensForUser(String userId) {
        return tokenRepository.findTokensByUserId(userId)
                .collectList()
                .flatMap(tokens -> {
                    if (tokens.isEmpty()) return Mono.empty();

                    log.info("Usuwanie {} blokad dla usera {}", tokens.size(), userId);
                    // Przekazujemy listę do repozytorium, żeby je usunęło
                    return tokenRepository.deleteTokensAndIndex(userId, reactor.core.publisher.Flux.fromIterable(tokens));
                });
    }
}