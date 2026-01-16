package com.polibuda.footballclub.match.entity;

import com.polibuda.footballclub.match.MatchStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "matches", indexes = {
        @Index(name = "idx_match_internal_team", columnList = "internal_team_id"),
        @Index(name = "idx_match_external_team", columnList = "external_team_id"),
        @Index(name = "idx_match_date", columnList = "match_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Match extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @Column(name = "internal_team_id", nullable = false)
    private Long internalTeamId;

    // ID zespołu zewnętrznego (z Football Data Service)
    @Column(name = "external_team_id", nullable = false)
    private Long externalTeamId;

    // Data meczu - niezbędna do sortowania (Terminarz vs Wyniki)
    @Column(name = "match_date", nullable = false)
    private LocalDateTime matchDate;

    @Column(name = "is_internal_team_home", nullable = false)
    @Builder.Default
    private Boolean isInternalTeamHome = true;

    // Status meczu (np. PLANOWANY, ZAKOŃCZONY, PRZEŁOŻONY)
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private MatchStatus status = MatchStatus.SCHEDULED;

    @Min(0)
    @Builder.Default
    private Long internalTeamScore = 0L;

    @Min(0)
    @Builder.Default
    private Long externalTeamScore = 0L;

}