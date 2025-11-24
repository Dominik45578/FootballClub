package com.polibuda.footballclub.identify.entity;

import com.polibuda.footballclub.common.database.UserRolesTable;
import com.polibuda.footballclub.common.database.UserTable;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import lombok.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(
        name = UserTable.USERS_TABLE
//        ,indexes = {
//                @Index(name = "idx_username", columnList = "username"),
//                @Index(name = "idx_email", columnList = "email")
//        }
)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(unique = true, nullable = false, length = 100)
    @Email
    private String email;

    @Column(nullable = false)
    private String password;

    @Builder.Default
    @Column(nullable = false)
    private Boolean enabled = false;

    @Builder.Default
    @Column(nullable = false, name = "account_non_expired")
    private Boolean accountNonExpired = true;

    @Builder.Default
    @Column(nullable = false, name = "account_non_locked")
    private Boolean accountNonLocked = false;

    @Builder.Default
    @Column(nullable = false, name = "credentials_non_expired")
    private Boolean credentialsNonExpired = true;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Builder.Default
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = UserRolesTable.USER_ROLES_TABLE,
            joinColumns = @JoinColumn(name = UserRolesTable.USER_ID),
            inverseJoinColumns = @JoinColumn(name = UserRolesTable.ROLE_ID)
//            ,indexes = {
//                    @Index(name = "idx_user_roles_user", columnList = UserRolesTable.USER_ID),
//                    @Index(name = "idx_user_roles_role", columnList = UserRolesTable.ROLE_ID)
//            }
    )

    private Set<Role> roles = new HashSet<>();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
