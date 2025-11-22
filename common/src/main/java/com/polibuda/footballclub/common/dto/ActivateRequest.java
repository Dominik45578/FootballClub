package com.polibuda.footballclub.common.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivateRequest {
    
    @NotBlank(message = "Username is required")
    @Email
    private String email;
    
    @NotBlank(message = "Activation code is required")
    @Size(min = 6, max = 10, message = "Activation code must be at least 6 characters")
    private String code;
}
