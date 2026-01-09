package com.polibuda.footballclub.football_external_data.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.*;
import lombok.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "teams")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamEntity {

    @Id
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "code")
    private String code;

    @Column(name = "country")
    private String country;

    @Column(name = "founded")
    private Integer founded;

    @Column(name = "is_national")
    private boolean national;

    @Column(name = "logo_url")
    private String logoUrl;

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "team_venues",
        joinColumns = @JoinColumn(name = "team_id"),
        inverseJoinColumns = @JoinColumn(name = "venue_id")
    )
    @Builder.Default
    private Set<VenueEntity> venues = new HashSet<>();


    // Relacja do zawodników
    @ManyToMany(mappedBy = "teams")
    @Builder.Default
    private Set<PlayerEntity> players = new HashSet<>();
}