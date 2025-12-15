package com.polibuda.footballclub.user.model;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class ApiErrorResponse {
    @Builder.Default
    private Instant timestamp = Instant.now();
    @Builder.Default
    private int status = 400;
    @Builder.Default
    private String error = "Something went wrong";
    @Builder.Default
    private String message = "Something went wrong";
    @Builder.Default
    private String path = "api/error";
}