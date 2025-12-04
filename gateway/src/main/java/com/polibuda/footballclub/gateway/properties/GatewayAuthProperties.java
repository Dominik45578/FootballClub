package com.polibuda.footballclub.gateway.properties;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "gateway.auth")
public class GatewayAuthProperties {

    @NotBlank
    private String identityBaseUri;

    @NotBlank
    private String jwtSecret;

    private boolean redirectOnUnauthenticated = true;

    private List<String> publicPaths = new ArrayList<>();

    private int maxAllowedRequestPerRoute ;

    private List<String> corsAllowedOrigins = List.of("http://localhost:4200");
}