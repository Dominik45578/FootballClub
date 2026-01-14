package com.polibuda.footballclub.common.dto;

import com.polibuda.footballclub.common.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class UserRoleDTO {
    private String role;
    private String description;
}
