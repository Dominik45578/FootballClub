package com.polibuda.footballclub.common.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Set;

@Data
@Builder
public class UpdateUserRoleRequestDTO {
    @Min(0)
    private Long userId;
    private List<String> roles;
}
