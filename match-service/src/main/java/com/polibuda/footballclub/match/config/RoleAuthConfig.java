package com.polibuda.footballclub.match.config;

import com.polibuda.footballclub.common.UserRoleAuth;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;

@Configuration
public class RoleAuthConfig {

    @Bean
    public RoleHierarchy roleHierarchy() {
        return  RoleHierarchyImpl.withDefaultRolePrefix()
                .role(UserRoleAuth.ADMIN.name()).implies(UserRoleAuth.MANAGER.name(), UserRoleAuth.PLAYER.name())
                .role(UserRoleAuth.MANAGER.name()).implies(UserRoleAuth.COACH.name(), UserRoleAuth.PHYSIO.name())
                .role(UserRoleAuth.COACH.name()).implies(UserRoleAuth.MEMBER.name() , UserRoleAuth.PLAYER.name())
                .role(UserRoleAuth.PLAYER.name()).implies(UserRoleAuth.MEMBER.name(),  UserRoleAuth.USER.name())
                .role(UserRoleAuth.MEMBER.name()).implies(UserRoleAuth.USER.name())
                .build();
//        String hierarchy =
//        String hierarchy = """
//                ROLE_ADMIN > ROLE_MANAGER
//                ROLE_MANAGER > ROLE_COACH
//                ROLE_MANAGER > ROLE_PHYSIO
//                ROLE_COACH > ROLE_PLAYER
//                ROLE_PHYSIO > ROLE_MEMBER
//                ROLE_MEMBER > ROLE_PLAYER
//                ROLE_PLAYER > ROLE_USER
//                """;
//
//        return RoleHierarchyImpl.fromHierarchy(hierarchy);
    }
}