// Package: com.polibuda.footballclub.gateway.config
package com.polibuda.footballclub.gateway.config;


import com.polibuda.footballclub.gateway.security.RedirectToIdentityEntryPoint;
import com.polibuda.footballclub.gateway.utils.WebFluxResponseHelper;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.server.resource.web.server.BearerTokenServerAuthenticationEntryPoint;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;


@Configuration
@EnableWebFluxSecurity
@EnableConfigurationProperties(GatewayAuthProperties.class)
public class SecurityConfig {


    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http,
                                                            GatewayAuthProperties props,
                                                            WebFluxResponseHelper helper) {
        ServerAuthenticationEntryPoint entryPoint = props.isRedirectOnUnauthenticated()
                ? new RedirectToIdentityEntryPoint(props, helper)
                : new BearerTokenServerAuthenticationEntryPoint();


        http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(authz -> authz
                        .pathMatchers(props.getPublicPaths().toArray(String[]::new)).permitAll()
                        .pathMatchers(HttpMethod.OPTIONS).permitAll()
                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(Customizer.withDefaults())
                        .authenticationEntryPoint(entryPoint)
                );


        return http.build();
    }
}