package com.polibuda.footballclub.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class UpdateUserRequest {
    private String username;
    private String email;
}
