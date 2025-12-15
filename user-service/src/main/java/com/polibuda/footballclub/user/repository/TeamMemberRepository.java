package com.polibuda.footballclub.user.repository;

import com.polibuda.footballclub.common.actions.TeamMemberStatus;
import com.polibuda.footballclub.user.entity.TeamMember;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {

    @EntityGraph(attributePaths = {"team"})
    List<TeamMember> findByMemberUserIdAndStatus(Long userId, TeamMemberStatus status);

    @EntityGraph(attributePaths = {"team"})
    List<TeamMember> findByMemberUserId(Long userId);

    @EntityGraph(attributePaths = {"member"})
    List<TeamMember> findByTeamIdAndStatus(Long teamId, TeamMemberStatus status);

    boolean existsByTeamIdAndMemberId(Long teamId, Long memberId);

    @EntityGraph(attributePaths = {"member", "team"})
    Optional<TeamMember> findByTeamIdAndMemberId(Long teamId, Long memberId);

    // FIX: Dodano metodę do weryfikacji uprawnień (szukanie po ID teamu i Globalnym ID usera)
    // Spring Data JPA potrafi to rozparsować (Member -> UserId), ale warto dodać EntityGraph dla wydajności
    @EntityGraph(attributePaths = {"member", "team"})
    Optional<TeamMember> findByTeamIdAndMemberUserId(Long teamId, Long userId);
}