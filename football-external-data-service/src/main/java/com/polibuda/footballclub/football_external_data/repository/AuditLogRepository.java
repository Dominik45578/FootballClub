package com.polibuda.footballclub.football_external_data.repository;

import com.polibuda.footballclub.football_external_data.entity.AuditLogEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLogEntity, Long> {
    
    // Pobieranie ostatnich N logów (realizowane przez Pageable w serwisie)
    @Query("SELECT a FROM AuditLogEntity a ORDER BY a.timestamp DESC")
    List<AuditLogEntity> findLatestLogs(Pageable pageable);
}