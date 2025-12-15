package com.polibuda.footballclub.user.repository;

import com.polibuda.footballclub.user.entity.Team;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {

    Optional<Team> findByCode(String code);
    boolean existsByCode(String code);

    Page<Team> findByNameContainingIgnoreCase(String name, Pageable pageable);

    @Query("SELECT DISTINCT t FROM Team t JOIN t.members tm WHERE tm.member.userId = :userId")
    Page<Team> findTeamsByMemberUserId(@Param("userId") Long userId, Pageable pageable);

    // 3. Pobranie konkretnego z dociągnięciem członków (optymalizacja N+1)
    @EntityGraph(attributePaths = {"members", "members.member"})
    Optional<Team> findById(Long id);
}