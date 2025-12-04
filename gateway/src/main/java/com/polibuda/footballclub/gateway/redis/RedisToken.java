package com.polibuda.footballclub.gateway.redis;

import com.polibuda.footballclub.common.actions.UserTokenActions;
import org.springframework.data.annotation.Id;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;
import org.springframework.data.redis.core.index.Indexed;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.TimeUnit;

@Data
@Builder
@AllArgsConstructor
@RedisHash("Token")
public class RedisToken {

    @Id
    @NotNull
    private String token;

    @Indexed
    @NotBlank
    private String userId;

    @NotNull
    private UserTokenActions userTokenActions;

    @TimeToLive(unit = TimeUnit.SECONDS)
    @Builder.Default
    private Long timeToLive = 3600L;


    public static long calcTtl(@NotNull Instant expiresAt) {
        if (expiresAt == null) {
            return 3600; // Domyślnie 1h jeśli brak daty (zabezpieczenie)
        }
        long secondsRemaining = Duration.between(Instant.now(), expiresAt).getSeconds();
        return Math.max(1, secondsRemaining);
    }
}