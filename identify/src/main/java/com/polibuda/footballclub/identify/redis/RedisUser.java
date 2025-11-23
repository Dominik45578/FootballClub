package com.polibuda.footballclub.identify.redis;


import org.springframework.data.annotation.Id;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;
import org.springframework.data.redis.core.RedisHash;
@Data
@Builder
@RedisHash("User")
public class RedisUser {
    @Id
    @Email
    private String email;

    @Size(min = 6, max = 10)
    private String verificationCode;
}
