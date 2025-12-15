package com.polibuda.footballclub.user.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.beans.factory.annotation.Value;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "members", indexes = {
        @Index(name = "idx_member_userid", columnList = "user_id"), // Ważny indeks do szukania membera po userze
        @Index(name = "idx_member_lastname", columnList = "last_name"),
        @Index(name = "idx_member_pesel", columnList = "pesel")
})
@Data
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Member extends AbstractAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;

    @Column(nullable = false, unique = true, length = 11)
    private String pesel;

    @Column(name = "birth_date", nullable = false)
    private Instant birthDate;

    @Column(name = "phone_number", length = 15)
    @Size(min = 9, max = 15)
    private String phoneNumber;

    @Min(0)
    @Max(250)
    @Builder.Default
    private Double height= 0d;

    @Min(0)
    @Max(150)
    @Builder.Default
    private Double weight = 0d;

    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<TeamMember> teamMemberships = new HashSet<>();
}