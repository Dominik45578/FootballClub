package com.polibuda.footballclub.football_external_data.entity;

import com.polibuda.footballclub.common.actions.AuditActionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ID użytkownika lub "SYSTEM" dla automatu
    @Column(name = "user_id", nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private AuditActionType actionType;

    @Column(name = "resource_name")
    private String resourceName;

    @Column(name = "details", length = 2048)
    private String details;

    @CreationTimestamp
    @Column(name = "timestamp", updatable = false)
    private Instant timestamp;
}