package com.polibuda.footballclub.user.model;

import com.polibuda.footballclub.common.UserRole;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class SpringSecurityService implements SecurityService {

    @Override
    public boolean hasRole(UserRole role) {
        return Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                .map(Authentication::getAuthorities)
                .map(authorities -> authorities.contains(new SimpleGrantedAuthority(role.toString())))
                .orElse(false);
    }

    @Override
    public Long getCurrentUserId() {
        return null;
    }
}