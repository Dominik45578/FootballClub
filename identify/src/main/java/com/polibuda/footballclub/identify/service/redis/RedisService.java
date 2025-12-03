package com.polibuda.footballclub.identify.service.redis;

import com.polibuda.footballclub.common.actions.UserAccountAction;
import com.polibuda.footballclub.identify.redis.RedisUser;
import java.util.Optional;

public interface RedisService {
    void saveCode(String email, String code, UserAccountAction action);
    Optional<RedisUser> findCode(String email, UserAccountAction action);
    void deleteCode(String email, UserAccountAction action);
    boolean validateCode(String email, String codeToCheck, UserAccountAction action);
}