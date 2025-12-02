package com.polibuda.footballclub.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Builder
@AllArgsConstructor
@Data
public class NewPasswordResponse {
    private boolean status;
    private String message;
    private Instant timestamp;
}
