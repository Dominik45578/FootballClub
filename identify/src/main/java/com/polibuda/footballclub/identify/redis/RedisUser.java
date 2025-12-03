package com.polibuda.footballclub.identify.redis;

import com.polibuda.footballclub.common.actions.NotificationAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.index.Indexed;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@RedisHash("User") // W Redisie klucz będzie wyglądał np.: "User:jan@wp.pl:RESET_PASSWORD"
public class RedisUser {

    @Id
    private String id; // To będzie nasz klucz złożony: "email:action"

    @Indexed // Dzięki temu nadal będziesz mógł szukać po samym emailu (opcjonalne)
    private String email;

    private String verificationCode;

    private NotificationAction notificationAction;

    // Helper do generowania ID - ułatwia życie
    public static String generateId(String email, NotificationAction action) {
        return email + ":" + action.name();
    }
}