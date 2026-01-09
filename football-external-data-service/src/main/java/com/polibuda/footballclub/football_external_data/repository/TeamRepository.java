package com.polibuda.footballclub.football_external_data.repository;

import com.polibuda.footballclub.football_external_data.entity.TeamEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<TeamEntity, Long> {

    /**
     * Znajduje drużyny, których nazwa zawiera podaną frazę (case-insensitive).
     * Odpowiada SQL: ... WHERE LOWER(name) LIKE LOWER(%phrase%)
     */
    List<TeamEntity> findAllByNameContainingIgnoreCase(String phrase);

    /**
     * Znajduje drużynę po unikalnym kodzie (np. "POL").
     */
    Optional<TeamEntity> findByCode(String code);

    /**
     * Znajduje wszystkie drużyny z danego kraju.
     */
    List<TeamEntity> findAllByCountry(String country);

    /**
     * Filtruje drużyny po statusie reprezentacji (true/false).
     */
    List<TeamEntity> findAllByNational(boolean national);

    @EntityGraph(attributePaths = {"players"})
    Optional<TeamEntity> findWithPlayersById(Long id);

    /* Przykład metody łączącej filtry (opcjonalnie):
       List<TeamEntity> findAllByCountryAndNational(String country, boolean national);
    */
}