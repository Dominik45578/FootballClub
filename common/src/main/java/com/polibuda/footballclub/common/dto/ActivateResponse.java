package com.polibuda.footballclub.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivateResponse {
    
    private boolean success;
    
    private String message;
    
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
