package com.polibuda.footballclub.gateway.config;

import com.polibuda.footballclub.common.claims.MutationHeaderClaims;
import com.polibuda.footballclub.gateway.properties.GatewayAuthProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class CorsGlobalConfig {

    private final GatewayAuthProperties props;

    /**
     * Konfiguracja dla IDENTITY (Logowanie/Rejestracja)
     */
    private CorsConfiguration getIdentityCorsConfiguration() {
        CorsConfiguration cors = new CorsConfiguration();

        // 1. Dynamiczne domeny z YML
        cors.setAllowedOrigins(props.getCorsAllowedOrigins());

        // 2. Metody HTTP (Stałe z Springa)
        cors.setAllowedMethods(List.of(
                HttpMethod.GET.name(),
                HttpMethod.POST.name(),
                HttpMethod.OPTIONS.name()
        ));


        cors.setAllowedHeaders(List.of(
                HttpHeaders.CONTENT_TYPE,
                "X-Requested-With" // Często używane przez klientów AJAX
        ));

        // 4. Nagłówki, które frontend może odczytać z odpowiedzi (Stałe z Twojej klasy)
        // Np. po zalogowaniu może chcieć odczytać ID użytkownika (opcjonalne)
        cors.setExposedHeaders(List.of(
                MutationHeaderClaims.X_USER_ID, MutationHeaderClaims.X_EMAIL
        ));

        cors.setAllowCredentials(true);
        cors.setMaxAge(3600L);
        return cors;
    }

    /**
     * Konfiguracja GLOBALNA (Dla reszty systemu)
     */
    private CorsConfiguration getGlobalCorsConfiguration() {
        CorsConfiguration cors = new CorsConfiguration();


        cors.setAllowedOrigins(props.getCorsAllowedOrigins());

        cors.setAllowedMethods(List.of(
                HttpMethod.GET.name(),
                HttpMethod.POST.name(),
                HttpMethod.PUT.name(),
                HttpMethod.DELETE.name(),
                HttpMethod.PATCH.name(),
                HttpMethod.OPTIONS.name()
        ));

        cors.setAllowedHeaders(List.of(
                HttpHeaders.AUTHORIZATION,
                HttpHeaders.CONTENT_TYPE,
                "X-Requested-With"
        ));


        cors.setExposedHeaders(List.of(
                MutationHeaderClaims.X_USER_ID,
                MutationHeaderClaims.X_ROLES,
                MutationHeaderClaims.X_SCOPE,
                MutationHeaderClaims.X_USERNAME,
                MutationHeaderClaims.X_EMAIL,
                MutationHeaderClaims.X_NON_BLOCKED,
                MutationHeaderClaims.X_ACTIVATED
        ));

        cors.setAllowCredentials(true);
        cors.setMaxAge(3600L);
        return cors;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/api/auth/**", getIdentityCorsConfiguration());

        source.registerCorsConfiguration("/**", getGlobalCorsConfiguration());

        return source;
    }
}