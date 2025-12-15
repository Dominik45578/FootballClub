package com.polibuda.footballclub.user.repository;

import com.polibuda.footballclub.user.entity.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByUserId(Long userId);
    boolean existsByPesel(String pesel);

    // FIX: Dodano brakującą metodę wyszukiwania
    @Query("SELECT m FROM Member m WHERE " +
            "LOWER(m.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(m.lastName) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Member> searchByQuery(@Param("query") String query, Pageable pageable);
}