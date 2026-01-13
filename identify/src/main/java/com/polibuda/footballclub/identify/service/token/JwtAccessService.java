package com.polibuda.footballclub.identify.service.token;

import com.polibuda.footballclub.identify.entity.User;

public interface JwtAccessService {
    
    String generateToken(User user);
    
    boolean validateToken(String token);
    
    Long extractUsername(String token);
    
    Long extractUserId(String token);
}
