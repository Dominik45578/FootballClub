package com.polibuda.footballclub.gateway.redis;

import com.polibuda.footballclub.common.actions.UserTokenActions;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Duration;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RedisToken implements Serializable {
    @NotBlank
    private String token;            // ID (klucz)
    @NotBlank
    private String userId;
    private UserTokenActions reason = UserTokenActions.TOKEN_BLOCKED_BY_LOGOUT;
    @Builder.Default
    private Long timeToLive = 3600L;        // TTL w sekundach
    @Builder.Default
    private Long blockedAt = Instant.now().getEpochSecond();

    public static long calcTtl(@NotNull Instant expiresAt) {
        if (expiresAt == null) {
            return 3600; // Domyślnie 1h jeśli brak daty (zabezpieczenie)
        }
        long secondsRemaining = Duration.between(Instant.now(), expiresAt).getSeconds();
        return Math.max(1, secondsRemaining);
    }
}