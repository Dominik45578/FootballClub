// Package: com.polibuda.footballclub.gateway.config
package com.polibuda.footballclub.gateway.config;


import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;
import java.util.ArrayList;
import java.util.List;


@Setter
@Getter
@Validated
@ConfigurationProperties(prefix = "gateway.auth")
public class GatewayAuthProperties {


    @NotBlank
    private String identityBaseUri;


    @NotBlank
    private String clientId;


    private String defaultScopes = "openid profile email";
    private boolean redirectOnUnauthenticated = true;
    private List<String> publicPaths = new ArrayList<>();


}