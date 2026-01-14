package com.polibuda.footballclub.identify.redis;

import com.polibuda.footballclub.common.actions.UserAccountAction;
import com.polibuda.footballclub.common.actions.UserSessionActions;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;
import org.springframework.data.redis.core.index.Indexed;

import java.util.concurrent.TimeUnit;

@Builder
@Data
@AllArgsConstructor
@RedisHash(value = "user_sessions", timeToLive = 3600*24)
public class BlockedUser {
    @Id
    @NonNull
    private String id;

    @Indexed
    @Min(0)
    private Long userId;


    @Builder.Default
    @TimeToLive(unit = TimeUnit.SECONDS)
    private Long timeToLiveSeconds = 3600*24L;

    @NotBlank
    private UserSessionActions userSessionActions;

    public static String generateId(Long id, UserSessionActions action) {
        return id.toString() + ":" + action.name();
    }
}
