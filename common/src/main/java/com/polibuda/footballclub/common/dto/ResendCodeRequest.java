package com.polibuda.footballclub.common.dto;

import com.polibuda.footballclub.common.actions.UserAccountAction;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Builder
@AllArgsConstructor
@Data
public class ResendCodeRequest {
    @NotBlank
    @Size(min=1, max=64)
    String email;
}
