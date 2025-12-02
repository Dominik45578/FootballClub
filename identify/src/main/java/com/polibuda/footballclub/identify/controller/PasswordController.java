package com.polibuda.footballclub.identify.controller;

import com.polibuda.footballclub.common.dto.NewPasswordRequest;
import com.polibuda.footballclub.common.dto.NewPasswordResponse;
import com.polibuda.footballclub.common.dto.ResetPasswordRequest;
import com.polibuda.footballclub.common.dto.ResetPasswordResponse;
import com.polibuda.footballclub.identify.service.password.PasswordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth/password")
@RequiredArgsConstructor
public class PasswordController {
    private final PasswordService passwordService;

    @PostMapping("/reset-request")
    public ResponseEntity<ResetPasswordResponse> requestReset(@RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(passwordService.initiatePasswordReset(request));
    }

    @PostMapping("/new-password")
    public ResponseEntity<NewPasswordResponse> newPassword(@Valid @RequestBody NewPasswordRequest request) {
        NewPasswordResponse response = passwordService.changePassword(request);
        return response.isStatus() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }
}