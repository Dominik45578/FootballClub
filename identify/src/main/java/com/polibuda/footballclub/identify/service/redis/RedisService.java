package com.polibuda.footballclub.identify.service.redis;

import com.polibuda.footballclub.common.actions.NotificationAction;
import com.polibuda.footballclub.identify.redis.RedisUser;
import java.util.Optional;

public interface RedisService {
    void saveCode(String email, String code, NotificationAction action);
    Optional<RedisUser> findCode(String email, NotificationAction action);
    void deleteCode(String email, NotificationAction action);
    boolean validateCode(String email, String codeToCheck, NotificationAction action);
}