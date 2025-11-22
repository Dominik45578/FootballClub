package com.polibuda.footballclub.identify.entity;

import com.polibuda.footballclub.common.database.UserRolesTable;
import com.polibuda.footballclub.common.database.UserTable;
import jakarta.persistence.*;
import lombok.*;
import java.util.Set;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Data
@Table(name = UserTable.USERS_TABLE)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = UserRolesTable.USER_ROLES_TABLE,
        joinColumns = @JoinColumn(name = UserRolesTable.USER_ID),
        inverseJoinColumns = @JoinColumn(name = UserRolesTable.ROLE_ID)
    )
    private Set<Role> roles;
}