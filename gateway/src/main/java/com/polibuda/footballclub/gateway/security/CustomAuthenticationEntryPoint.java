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

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@RequiredArgsConstructor
public class CustomAuthenticationEntryPoint implements ServerAuthenticationEntryPoint {

    private final GatewayAuthProperties props;
    private final WebFluxResponseHelper responseHelper;

    @Override
    public Mono<Void> commence(ServerWebExchange exchange, AuthenticationException ex) {
        String path = exchange.getRequest().getPath().value();
        log.warn("Unauthorized access to: {} | Reason: {}", path, ex.getMessage());

        // Logika: Przekieruj tylko jeśli włączone ORAZ to nie jest żądanie XHR (AJAX)
        // Można dodać sprawdzanie nagłówka "X-Requested-With"
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

        // identityBaseUri powinno wskazywać na np. http://localhost:12001/api/auth
        // Budujemy URL: /login?redirect_uri=...
        String baseUri = props.getIdentityBaseUri().replaceAll("/+$", "");
        String loginUrl = String.format("%s/login?redirect_uri=%s", baseUri, currentUrl);

        exchange.getResponse().setStatusCode(HttpStatus.FOUND);
        exchange.getResponse().getHeaders().set("Location", loginUrl);
        return exchange.getResponse().setComplete();
    }
}