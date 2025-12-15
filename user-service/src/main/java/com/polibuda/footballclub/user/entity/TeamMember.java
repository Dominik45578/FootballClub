package com.polibuda.footballclub.user.entity;

import com.polibuda.footballclub.common.actions.TeamMemberStatus;
import com.polibuda.footballclub.common.database.TeamRole;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "team_members", uniqueConstraints = {
        // Unikalność: Jeden user może być w danym teamie tylko raz (niezależnie od statusu)
        @UniqueConstraint(name = "uk_team_member", columnNames = {"team_id", "member_id"})
})
@Data
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamMember extends AbstractAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "team_member_roles",
            joinColumns = @JoinColumn(name = "team_member_id")
    )
    @Column(name = "role")
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Set<TeamRole> roles = new HashSet<>();

    // ZMIANA: Zamiast boolean isActive -> Status
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private TeamMemberStatus status = TeamMemberStatus.WAITING_FOR_VERIFICATION;

    // Helper methods (Logic)
    public boolean isCaptain() {
        return roles.contains(TeamRole.ROLE_TEAM_CAPTAIN);
    }

    public boolean isCoach() {
        return roles.contains(TeamRole.ROLE_TEAM_HEAD_COACH) || roles.contains(TeamRole.ROLE_TEAM_ASSISTANT_COACH);
    }
}