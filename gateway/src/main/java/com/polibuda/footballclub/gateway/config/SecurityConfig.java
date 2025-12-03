package com.polibuda.footballclub.gateway.config;

import com.polibuda.footballclub.gateway.properties.GatewayAuthProperties;
import com.polibuda.footballclub.gateway.security.CustomAuthenticationEntryPoint;
import com.polibuda.footballclub.gateway.utils.WebFluxResponseHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.reactive.CorsConfigurationSource;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
@EnableWebFluxSecurity
@EnableConfigurationProperties(GatewayAuthProperties.class)
@RequiredArgsConstructor
public class SecurityConfig {

    private final GatewayAuthProperties props;
    private final WebFluxResponseHelper responseHelper;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                // Podpinamy konfigurację CORS tutaj
                .cors(cors -> cors.configurationSource(corsConfigurationSource))

                .authorizeExchange(auth -> auth
                        // 1. Whitelist (publiczne endpointy z properties)
                        .pathMatchers(props.getPublicPaths().toArray(String[]::new)).permitAll()

                        // 2. Obsługa preflight CORS (OPTIONS) jest kluczowa dla przeglądarek
                        .pathMatchers(HttpMethod.OPTIONS).permitAll()

                        // 3. Reszta wymaga uwierzytelnienia
                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtDecoder(jwtDecoder()))
                        .authenticationEntryPoint(new CustomAuthenticationEntryPoint(props, responseHelper))
                )
                .build();
    }

    @Bean
    public ReactiveJwtDecoder jwtDecoder() {
        SecretKeySpec secretKey = new SecretKeySpec(
                props.getJwtSecret().getBytes(StandardCharsets.UTF_8),
                "HmacSHA512"
        );

        return NimbusReactiveJwtDecoder.withSecretKey(secretKey)
                .macAlgorithm(MacAlgorithm.HS512)
                .build();
    }
}