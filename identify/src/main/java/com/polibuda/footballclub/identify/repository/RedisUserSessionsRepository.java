package com.polibuda.footballclub.identify.repository;

import com.polibuda.footballclub.identify.redis.BlockedUser;
import com.polibuda.footballclub.identify.redis.RedisUser;
import org.springframework.data.repository.CrudRepository;

import java.util.Optional;

public interface RedisUserSessionsRepository extends CrudRepository<BlockedUser, String> {
    Optional<BlockedUser> findByUserId(Long id);
    void deleteByUserId(Long id);
}
