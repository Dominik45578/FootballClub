package com.polibuda.footballclub.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
@Builder
@AllArgsConstructor
@Data
public class ResetPasswordResponse {
    @Builder.Default
    private boolean status = true;
    @Builder.Default
    private String message ="If this account exist, you will receive email with password reset code";
    @Builder.Default
    private Instant timestamp = Instant.now();
}
