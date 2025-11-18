package com.polibuda.footballclub.gateway.model;


import com.polibuda.footballclub.gateway.model.UserContext;
import org.springframework.security.oauth2.jwt.Jwt;


import java.util.Set;


public interface ClaimExtractor {
UserContext extract(Jwt jwt);
}