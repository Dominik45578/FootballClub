package com.polibuda.footballclub.user.model;

import com.polibuda.footballclub.common.UserRole;

public interface SecurityService {
    boolean hasRole(UserRole role);
    Long getCurrentUserId();
}