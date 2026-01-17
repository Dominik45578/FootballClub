package com.polibuda.footballclub.common.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Builder
@Data
public class UserResponseDTO {
    private Long userId;
    private String userName;
    private String userEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Set<UserRoleDTO> userRole;
    private boolean enabled;
    private boolean accountNonLocked;
}
