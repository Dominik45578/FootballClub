package com.polibuda.footballclub.identify.repository;

import com.polibuda.footballclub.identify.entity.User;
import com.polibuda.footballclub.identify.redis.RedisUser;
import org.springframework.data.repository.CrudRepository;

import java.util.Optional;

public interface RedisUserRepository extends CrudRepository<RedisUser, String> {
    Optional<RedisUser> findByEmail(String email);
    Optional<RedisUser> findById(String id);
}
