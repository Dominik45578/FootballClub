package com.polibuda.footballclub.gateway.redis;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id; // Poprawny import dla Spring Data
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;

import java.io.Serializable;
import java.time.Instant;
import java.util.concurrent.TimeUnit;

@Data
@Builder
@NoArgsConstructor // Wymagane przez biblioteki do deserializacji
@AllArgsConstructor
@RedisHash("RequestCount")
public class RedisRequestCounter implements Serializable {

    @Id
    private String id;

    // Usunięte @NotBlank - to jest int
    @Builder.Default
    private int requestCount = 0;

    @TimeToLive(unit = TimeUnit.SECONDS)
    @Builder.Default
    private Long timeToLive = 3600L;

    @Builder.Default
    private Instant lastRequestTime = Instant.now();
}