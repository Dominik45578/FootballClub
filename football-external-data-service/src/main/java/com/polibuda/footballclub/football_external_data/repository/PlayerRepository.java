package com.polibuda.footballclub.football_external_data.repository;

import com.polibuda.footballclub.football_external_data.entity.PlayerEntity;
import com.polibuda.footballclub.football_external_data.model.FieldPosition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlayerRepository extends JpaRepository<PlayerEntity, Long> {

    /**
     * Znajduje zawodników, których nazwisko/imię zawiera podaną frazę.
     */
    List<PlayerEntity> findAllByNameContainingIgnoreCase(String phrase);

    /**
     * Filtrowanie po pozycji na boisku (odpowiednik filtrowania kategorialnego).
     */
    List<PlayerEntity> findAllByPosition(FieldPosition position);

    /**
     * Filtrowanie po numerze na koszulce.
     */
    List<PlayerEntity> findAllByNumber(int number);

    List<PlayerEntity> findAllByTeamsId(Long teamId);
    // Jeśli potrzebujesz znaleźć zawodników grających w konkretnym kraju (poprzez relację z Team),
    // wymagałoby to zapytania złączeniowego, np.:
    // List<PlayerEntity> findByTeams_Country(String country);
}