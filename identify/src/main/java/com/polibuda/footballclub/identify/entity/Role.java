package com.polibuda.footballclub.identify.entity;

import com.polibuda.footballclub.common.database.RoleTable;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = RoleTable.ROLE_TABLE)
public class Role  implements GrantedAuthority {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = RoleTable.ROLE_ID)
    private Long id;

    @Column(unique = true, name = RoleTable.ROLE_NAME)
    private String name;

    @Override
    public String getAuthority() {
        return name;
    }
}
