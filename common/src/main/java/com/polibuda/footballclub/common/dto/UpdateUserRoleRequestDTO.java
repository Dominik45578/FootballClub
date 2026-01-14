package com.polibuda.footballclub.common.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Set;

@Data
@Builder
public class UpdateUserRoleRequestDTO {
    private String userId;
    private Set<String> roleId;
}
