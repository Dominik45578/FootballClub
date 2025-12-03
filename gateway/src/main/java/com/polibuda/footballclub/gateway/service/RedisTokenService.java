package com.polibuda.footballclub.gateway.service;

import com.polibuda.footballclub.common.actions.UserTokenActions;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;

public interface RedisTokenService {

    /**
     * Dodaje token do czarnej listy Redis, ustawiając czas wygaśnięcia
     * zgodny z czasem wygaśnięcia oryginalnego tokena.
     *
     * @param jwt Obiekt tokena JWT zawierający dane (wartość, ID użytkownika, czas wygaśnięcia).
     * @param reason Przyczyna zablokowania tokena (np. zmiany uprawnień, nadużycie).
     */
    void blockToken(Jwt jwt, UserTokenActions reason);

    /**
     * Sprawdza, czy dany token znajduje się na czarnej liście w Redis.
     *
     * @param tokenValue Wartość tokena (String) do sprawdzenia.
     * @return true, jeśli token jest zablokowany i znajduje się w Redis; false w przeciwnym razie.
     */
    boolean isTokenBlocked(Jwt tokenValue);

    /**
     * Usuwa wszystkie zablokowane tokeny powiązane z danym identyfikatorem użytkownika.
     * Przydatne do wymuszenia wylogowania ze wszystkich urządzeń.
     *
     * @param userId Identyfikator użytkownika, którego blokady mają zostać usunięte.
     */
    void unblockAllTokensForUser(String userId);

}