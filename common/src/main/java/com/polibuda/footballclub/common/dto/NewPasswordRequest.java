package com.polibuda.footballclub.common.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Builder
@AllArgsConstructor
@Data
public class NewPasswordRequest {
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank
    @Size(min = 8, message = "Repeated Password must be at least 8 characters")
    private String confirmNewPassword;

    @NotBlank(message = "Email is required")
    @Size(min = 6, message = "Email must be at least 6 characters")
    @Email
    private String email;

    @NotBlank(message = "Activation code is required")
    @Size(min = 6, max = 10, message = "Activation code must be al least characters and max 10")
    private String code;
}
