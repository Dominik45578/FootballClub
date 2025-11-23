package com.polibuda.footballclub.identify.service.user;

import com.polibuda.footballclub.identify.entity.User;
import com.polibuda.footballclub.identify.redis.RedisUser;

public interface UserService {
    
    User findByUsername(String username);
    
    User findById(Long userId);

    User findByEmail(String email);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    User save(User user);
    RedisUser save(RedisUser redisUser);
}
