package com.polibuda.footballclub.gateway.security;

import com.polibuda.footballclub.gateway.properties.GatewayAuthProperties;
import com.polibuda.footballclub.gateway.utils.WebFluxResponseHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@RequiredArgsConstructor
public class CustomAuthenticationEntryPoint implements ServerAuthenticationEntryPoint {

    private final GatewayAuthProperties props;
    private final WebFluxResponseHelper responseHelper;

    @Override
    public Mono<Void> commence(ServerWebExchange exchange, AuthenticationException ex) {
        String currentPath = exchange.getRequest().getURI().getPath();

        // Pobieramy ścieżkę do logowania z konfiguracji (np. /api/auth)
        // Zakładamy, że identityBaseUri to np. http://localhost:12001/api/auth
        URI identityUri = URI.create(props.getIdentityBaseUri());
        String loginBasePath = identityUri.getPath();

        log.warn("Unauthorized access to: {} | Reason: {}", currentPath, ex.getMessage());

        // --- DETEKCJA PĘTLI PRZEKIEROWAŃ ---
        // Jeśli użytkownik jest już na ścieżce autoryzacyjnej (np. /api/auth/login),
        // a mimo to wystąpił błąd autoryzacji (np. zły token), NIE PRZEKIEROWUJEMY PONOWNIE.
        // To przerywa pętlę "Redirect Loop".
        if (currentPath.startsWith(loginBasePath)) {
            log.error("Redirect loop detected! User is already at {} but authentication failed. Returning 401.", currentPath);
            return responseHelper.writeError(
                    exchange,
                    HttpStatus.UNAUTHORIZED,
                    "Unauthorized",
                    "Invalid token provided during login flow."
            );
        }

        // Standardowa logika przekierowania
        if (props.isRedirectOnUnauthenticated()) {
            return redirectToLogin(exchange);
        }

        return responseHelper.writeError(
                exchange,
                HttpStatus.UNAUTHORIZED,
                "Unauthorized",
                "Authentication required. Please log in."
        );
    }

    private Mono<Void> redirectToLogin(ServerWebExchange exchange) {
        String currentUrl = URLEncoder.encode(exchange.getRequest().getURI().toString(), StandardCharsets.UTF_8);

        String baseUri = props.getIdentityBaseUri().replaceAll("/+$", "");
        // Dodajemy /login, zakładając że Identity Service ma taki endpoint
        String loginUrl = String.format("%s/login?redirect_uri=%s", baseUri, currentUrl);

        exchange.getResponse().setStatusCode(HttpStatus.FOUND);
        exchange.getResponse().getHeaders().set("Location", loginUrl);

        // Dodatkowe nagłówki anty-cache
        exchange.getResponse().getHeaders().set("Cache-Control", "no-store");

        return exchange.getResponse().setComplete();
    }
}