package com.polibuda.footballclub.identify.service.user;

import com.polibuda.footballclub.identify.entity.User;

public interface UserService {
    
    User findByUsername(String username);
    
    User findById(Long userId);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    User save(User user);
}
