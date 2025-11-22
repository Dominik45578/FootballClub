package com.polibuda.footballclub.gateway.security;

import com.polibuda.footballclub.gateway.properties.GatewayAuthProperties;
import com.polibuda.footballclub.gateway.utils.WebFluxResponseHelper;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class CustomAuthenticationEntryPoint implements ServerAuthenticationEntryPoint {

    private final GatewayAuthProperties props;
    private final WebFluxResponseHelper helper;

    public CustomAuthenticationEntryPoint(GatewayAuthProperties props, WebFluxResponseHelper helper) {
        this.props = props;
        this.helper = helper;
    }

    @Override
    public Mono<Void> commence(ServerWebExchange exchange, AuthenticationException ex) {
        // Redirect do strony logowania Identity Service
        if (props.isRedirectOnUnauthenticated()) {
            String loginUrl = buildLoginUrl(exchange);
            exchange.getResponse().setStatusCode(HttpStatus.FOUND);
            exchange.getResponse().getHeaders().set("Location", loginUrl);
            return exchange.getResponse().setComplete();
        }
        
        // Lub zwróć JSON error
        return helper.writeError(
            exchange, 
            HttpStatus.UNAUTHORIZED, 
            "unauthorized", 
            "Authentication required. Please login at " + props.getIdentityBaseUri() + "/login"
        );
    }

    private String buildLoginUrl(ServerWebExchange exchange) {
        String base = props.getIdentityBaseUri().replaceAll("/+$", "");
        String redirectAfterLogin = URLEncoder.encode(
            exchange.getRequest().getURI().toString(), 
            StandardCharsets.UTF_8
        );
        
        // Prosty redirect do frontendu z informacją o wymaganym logowaniu
        return String.format("%s/login?redirect_uri=%s", base, redirectAfterLogin);
    }
}
