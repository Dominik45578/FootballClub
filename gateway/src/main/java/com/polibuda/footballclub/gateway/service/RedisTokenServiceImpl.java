package com.polibuda.footballclub.gateway.service;

import com.polibuda.footballclub.common.actions.UserTokenActions;
import com.polibuda.footballclub.gateway.redis.RedisToken;
import com.polibuda.footballclub.gateway.redis.RedisTokenRepository;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j // Dodajemy prosty logger
@Service // Oznaczenie, że jest to komponent serwisu Springa
@RequiredArgsConstructor // Automatycznie wstrzykuje zależności z final
public class RedisTokenServiceImpl implements RedisTokenService {

    private final RedisTokenRepository redisTokenRepository;

    @Override
    public void blockToken(Jwt jwt, UserTokenActions reason) {
        // Używamy statycznej metody fabrykującej (create) z klasy RedisToken
        // do automatycznego obliczenia TTL i stworzenia obiektu.

        RedisToken redisToken = RedisToken.builder()
                .token(jwt)
                .userTokenActions(reason)
                .timeToLive(RedisToken.CalcTtl(jwt.getExpiresAt()))
                .userId(jwt.getSubject())
                .build();

        redisTokenRepository.save(redisToken);
        log.info("Token zablokowany: userId={}, token={}", jwt.getSubject(), jwt.getTokenValue());
    }

    @Override
    public boolean isTokenBlocked(@NotBlank Jwt tokenValue) {
        boolean isBlocked = redisTokenRepository.findById(tokenValue).isPresent();
        
        if (isBlocked) {
            log.warn("ODRZUCONO: Użyto zablokowanego tokena: {}", tokenValue);
        }
        
        return isBlocked;
    }

    @Override
    public void unblockAllTokensForUser(String userId) {
        // 1. Znajdujemy wszystkie zablokowane tokeny danego użytkownika (dzięki @Indexed na userId)
        List<RedisToken> blockedTokens = redisTokenRepository.findAllByUserId(userId);

        if (!blockedTokens.isEmpty()) {
            // 2. Usuwamy wszystkie znalezione tokeny
            redisTokenRepository.deleteAll(blockedTokens);
            log.info("Usunięto {} blokad tokenów dla użytkownika: {}", blockedTokens.size(), userId);
        } else {
            log.debug("Brak zablokowanych tokenów do usunięcia dla użytkownika: {}", userId);
        }
    }
}