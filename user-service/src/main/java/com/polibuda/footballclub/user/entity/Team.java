package com.polibuda.footballclub.user.entity;

import com.polibuda.footballclub.common.database.TeamCategory;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "teams", indexes = {
    @Index(name = "idx_team_code", columnList = "code")
})
@Data
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Team extends AbstractAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;


    @Column(nullable = false, unique = true, length = 16)
    @Size(min = 10, max = 16) 
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TeamCategory category;

    @OneToMany(mappedBy = "team", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<TeamMember> members = new HashSet<>();
}