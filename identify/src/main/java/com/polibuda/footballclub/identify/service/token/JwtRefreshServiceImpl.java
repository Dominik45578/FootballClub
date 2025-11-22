package com.polibuda.footballclub.identify.service.token;

import com.polibuda.footballclub.common.claims.TokenClaims;
import com.polibuda.footballclub.identify.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class JwtRefreshServiceImpl implements JwtRefreshService {

    private final SecretKey secretKey;
    private final long expiration;

    public JwtRefreshServiceImpl(
            @Value("${jwt.refresh-secret}") String secret,
            @Value("${jwt.refresh-token-expiration:86400000}") long expiration) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiration = expiration;
    }

    @Override
    public String generateToken(User user) {
        Map<String, Object> claims = buildClaims(user);
        return buildToken(claims, user.getUsername());
    }

    @Override
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.error("Refresh token validation failed: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    @Override
    public Long extractUserId(String token) {
        Claims claims = extractClaims(token);
        String userIdStr = claims.get(TokenClaims.USER_ID, String.class);
        return userIdStr != null ? Long.parseLong(userIdStr) : null;
    }

    private Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Map<String, Object> buildClaims(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(TokenClaims.USER_ID, user.getId().toString());
        return claims;
    }

    private String buildToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(secretKey, SignatureAlgorithm.HS512)
                .compact();
    }
}
