package com.polibuda.footballclub.gateway.redis;

import org.springframework.data.repository.CrudRepository;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repozytorium do zarządzania encjami RedisToken (czarna lista tokenów) w Redis.
 * <p>
 * Kluczem głównym (ID) jest wartość tokena.
 * Aby znaleźć token po jego wartości (ID), użyj wbudowanej metody {@code findById(String)}.
 */
@Repository
public interface RedisTokenRepository extends CrudRepository<RedisToken, Jwt> {

    /**
     * Wyszukuje wszystkie zablokowane tokeny powiązane z podanym identyfikatorem użytkownika.
     * <p>
     * Ta operacja jest możliwa dzięki adnotacji {@code @Indexed}
     * umieszczonej nad polem {@code userId} w klasie {@link RedisToken}.
     * Jest to przydatne do implementacji funkcji takich jak "Wyloguj ze wszystkich urządzeń".
     *
     * @param userId Identyfikator użytkownika, którego tokeny mają zostać odnalezione.
     * @return Lista obiektów {@link RedisToken} reprezentujących zablokowane tokeny dla danego użytkownika.
     */
    List<RedisToken> findAllByUserId(String userId);
}