// Package: com.polibuda.footballclub.gateway.config
package com.polibuda.footballclub.gateway.config;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.web.server.ServerWebExchange;

import java.util.List;

@Configuration
public class CorsGlobalConfig {

    public CorsConfiguration getCorsConfigurationIdentify() {
        var cors = new CorsConfiguration();
        cors.setAllowedOrigins(List.of("https://twoja-domena.pl")); // produkcja
        cors.setAllowedMethods(List.of("GET", "POST"));
        cors.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));
        cors.setExposedHeaders(List.of("X-User-Id", "X-Roles"));
        cors.setAllowCredentials(false);
        cors.setMaxAge(3600L);
        return cors;
    }

    public CorsConfiguration getCorsConfigurationGlobal() {
        var cors = new CorsConfiguration();
        cors.setAllowedOrigins(List.of("https://twoja-domena.pl"));
        cors.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        cors.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));
        cors.setExposedHeaders(List.of("X-User-Id", "X-Roles"));
        cors.setAllowCredentials(true);
        cors.setMaxAge(3600L);
        return cors;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration corsGlobal = getCorsConfigurationGlobal();
        CorsConfiguration corsIdentify = getCorsConfigurationIdentify();

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsGlobal);
        source.registerCorsConfiguration("/auth/**", corsIdentify);

        return source;
    }
}