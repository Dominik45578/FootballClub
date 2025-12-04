package com.polibuda.footballclub.gateway.controller;


import com.polibuda.footballclub.common.actions.UserTokenActions;
import com.polibuda.footballclub.gateway.redis.RedisToken;
import com.polibuda.footballclub.gateway.service.RedisTokenService;
import lombok.AllArgsConstructor;
import org.springframework.boot.autoconfigure.security.SecurityProperties;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("api/")
@AllArgsConstructor
public class LogoutController {

    RedisTokenService redisTokenService;

    @PostMapping("/logout")
    public Mono<Void> logout(@AuthenticationPrincipal Jwt jwt) {
        return redisTokenService.blockToken(
                RedisToken.builder()
                        .token(jwt.getTokenValue())
                        .reason(UserTokenActions.TOKEN_BLOCKED_BY_LOGOUT)
                        .timeToLive(RedisToken.calcTtl(jwt.getExpiresAt()))
                        .userId(jwt.getSubject())
                        .build()
        );
    }
}
