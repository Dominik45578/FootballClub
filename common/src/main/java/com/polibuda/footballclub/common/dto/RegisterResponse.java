package com.polibuda.footballclub.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RegisterResponse {
    private boolean success;
    private String message;
}