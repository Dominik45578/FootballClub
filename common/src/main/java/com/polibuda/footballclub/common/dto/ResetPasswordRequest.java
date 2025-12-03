package com.polibuda.footballclub.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
@AllArgsConstructor
public class ResetPasswordRequest {
    private String email;
}
