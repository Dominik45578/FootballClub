package com.polibuda.footballclub.identify.service.redis;

import com.polibuda.footballclub.common.actions.UserAccountAction;
import com.polibuda.footballclub.identify.redis.RedisUser;
import com.polibuda.footballclub.identify.repository.RedisUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisServiceImpl implements RedisService {

    private final RedisUserRepository redisUserRepository;

    @Override
    public void saveCode(String email, String code, UserAccountAction action) {
        String id = RedisUser.generateId(email, action);
        RedisUser redisUser = RedisUser.builder()
                .id(id)
                .email(email)
                .verificationCode(code)
                .userAccountAction(action)
                .build();
        redisUserRepository.save(redisUser);
        log.debug("Saved code in Redis. ID: {}, Action: {}", id, action);
    }

    @Override
    public Optional<RedisUser> findCode(String email, UserAccountAction action) {
        String id = RedisUser.generateId(email, action);
        return redisUserRepository.findById(id);
    }

    @Override
    public void deleteCode(String email, UserAccountAction action) {
        String id = RedisUser.generateId(email, action);
        redisUserRepository.deleteById(id);
        log.debug("Deleted code from Redis. ID: {}", id);
    }

    @Override
    public boolean validateCode(String email, String codeToCheck, UserAccountAction action) {
        return findCode(email, action)
                .map(ru -> ru.getVerificationCode().equals(codeToCheck))
                .orElse(false);
    }
}