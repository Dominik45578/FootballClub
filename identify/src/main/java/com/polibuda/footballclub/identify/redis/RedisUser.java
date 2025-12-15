package com.polibuda.footballclub.identify.redis;

import com.polibuda.footballclub.common.actions.UserAccountAction;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
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
    @NonNull
    private String id; // To będzie nasz klucz złożony: "email:action"

    @Indexed // Dzięki temu nadal będziesz mógł szukać po samym emailu (opcjonalne)
    @NotBlank
    @Size(min = 5, max = 32)
    private String email;

    @NotBlank
    @Size(min = 6, max = 10)
    private String verificationCode;

    @NotBlank
    private UserAccountAction userAccountAction;

    // Helper do generowania ID - ułatwia życie
    public static String generateId(String email, UserAccountAction action) {
        return email + ":" + action.name();
    }
}