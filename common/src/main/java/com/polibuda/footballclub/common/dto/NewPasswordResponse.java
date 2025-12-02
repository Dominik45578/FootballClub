package com.polibuda.footballclub.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Builder
@AllArgsConstructor
@Data
public class NewPasswordResponse {
    @Builder.Default
    private boolean status = false;
    @Builder.Default
    private String message = "Problem with your password";
    @Builder.Default
    private Instant timestamp = Instant.now();
}
