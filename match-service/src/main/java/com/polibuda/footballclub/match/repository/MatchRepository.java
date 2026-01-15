package com.polibuda.footballclub.match.repository;

import com.polibuda.footballclub.match.MatchStatus;
import com.polibuda.footballclub.match.entity.Match;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {
    Page<Match> findAllByInternalTeamId(Long internalTeamId, Pageable pageable);
    List<Match> findAllByExternalTeamId(Long externalTeamId);

    Page<Match> findAllByInternalTeamIdIn(Collection<Long> internalTeamIds, Pageable pageable);

    // --- Terminarz i Historia ---
    @Query("SELECT m FROM Match m WHERE m.internalTeamId = :teamId AND m.matchDate > :date ORDER BY m.matchDate ASC")
    List<Match> findUpcomingMatches(@Param("teamId") Long teamId, @Param("date") LocalDateTime date);

    // Wersja dla listy zespołów (np. "Nadchodzące mecze moich drużyn")
    @Query("SELECT m FROM Match m WHERE m.internalTeamId IN :teamIds AND m.matchDate > :date ORDER BY m.matchDate ASC")
    List<Match> findUpcomingMatchesForTeams(@Param("teamIds") Collection<Long> teamIds, @Param("date") LocalDateTime date);

    Page<Match> findAllByStatusAndInternalTeamId(MatchStatus status, Long internalTeamId, Pageable pageable);

    boolean existsByInternalTeamIdAndMatchDateBetween(Long internalTeamId, LocalDateTime start, LocalDateTime end);
}