package com.polibuda.footballclub.gateway.config;

import com.polibuda.footballclub.gateway.properties.GatewayAuthProperties;
import com.polibuda.footballclub.gateway.security.CustomAuthenticationEntryPoint;
import com.polibuda.footballclub.gateway.utils.WebFluxResponseHelper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
@EnableWebFluxSecurity
@EnableConfigurationProperties(GatewayAuthProperties.class)
public class SecurityConfig {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(
            ServerHttpSecurity http,
            GatewayAuthProperties props,
            WebFluxResponseHelper helper,
            ReactiveJwtDecoder jwtDecoder) {

        ServerAuthenticationEntryPoint entryPoint =
                new CustomAuthenticationEntryPoint(props, helper);

        http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(authz -> authz
                        .pathMatchers(props.getPublicPaths().toArray(String[]::new)).permitAll()
                        .pathMatchers(HttpMethod.OPTIONS).permitAll()
                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtDecoder(jwtDecoder))
                        .authenticationEntryPoint(entryPoint)
                );

        return http.build();
    }

    @Bean
    public ReactiveJwtDecoder jwtDecoder() {
        // Ten sam secret co w Identity Service
        SecretKey key = new SecretKeySpec(
                jwtSecret.getBytes(StandardCharsets.UTF_8),
                "HmacSHA512"
        );
        return NimbusReactiveJwtDecoder.withSecretKey(key).build();
    }
}
