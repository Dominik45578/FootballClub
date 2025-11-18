// Package: com.polibuda.footballclub.gateway.security
package com.polibuda.footballclub.gateway.security;


import com.polibuda.footballclub.gateway.config.GatewayAuthProperties;

import com.polibuda.footballclub.gateway.utils.WebFluxResponseHelper;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;


import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;


public class RedirectToIdentityEntryPoint implements ServerAuthenticationEntryPoint {


    private final GatewayAuthProperties props;
    private final WebFluxResponseHelper helper;


    public RedirectToIdentityEntryPoint(GatewayAuthProperties props, WebFluxResponseHelper helper) {
        this.props = props;
        this.helper = helper;
    }


    @Override
    public Mono<Void> commence(ServerWebExchange exchange, AuthenticationException ex) {
// If redirect mode is enabled -> 302 Location
        if (props.isRedirectOnUnauthenticated()) {
            String authorizeUrl = buildAuthorizeUrl(exchange.getRequest());
            exchange.getResponse().setStatusCode(HttpStatus.FOUND);
            exchange.getResponse().getHeaders().set("Location", authorizeUrl);
            return exchange.getResponse().setComplete();
        }
// otherwise return JSON error body with public message
        return helper.writeError(exchange, HttpStatus.UNAUTHORIZED, "unauthorized", "Authentication required");
    }


    private String buildAuthorizeUrl(ServerHttpRequest request) {
        String redirect = URLEncoder.encode(request.getURI().toString(), StandardCharsets.UTF_8);
        String scopes = URLEncoder.encode(props.getDefaultScopes(), StandardCharsets.UTF_8);
        String base = props.getIdentityBaseUri().replaceAll("/+$", "");


        return String.format(
                "%s/oauth2/authorize?response_type=code&client_id=%s&scope=%s&redirect_uri=%s",
                base,
                urlEncode(props.getClientId()),
                scopes,
                redirect
        );
    }


    private static String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}