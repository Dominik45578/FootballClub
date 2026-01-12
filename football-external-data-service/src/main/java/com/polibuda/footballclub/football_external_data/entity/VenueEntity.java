package com.polibuda.footballclub.football_external_data.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "venues")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VenueEntity {

    @Id
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "name", nullable = true)
    private String name;

    @Column(name = "address")
    private String address;

    @Column(name = "city")
    private String city;

    @Column(name = "capacity")
    private Long capacity;

    @Column(name = "surface")
    private String surface;

    @Column(name = "logo_url")
    private String logoUrl;

    // Relacja zwrotna (opcjonalna, ale przydatna)
    @ManyToMany(mappedBy = "venues")
    @Builder.Default
    private Set<TeamEntity> teams = new HashSet<>();
}