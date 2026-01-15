package com.polibuda.footballclub.identify.controller;

import com.polibuda.footballclub.common.dto.*;
import com.polibuda.footballclub.identify.service.actiavte.ActivateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class ActivateController {
    private final ActivateService activateService;

    @PostMapping("/activate")
    public ResponseEntity<ActivateResponse> activate(@Valid @RequestBody ActivateRequest request) {
        ActivateResponse response = activateService.activateAccount(request);
        return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }

    @PostMapping("/activate/resend")
    public ResponseEntity<Boolean> resend(@Valid @RequestBody ResendCodeRequest request) {
        boolean status = activateService.resendActivationCode(request);
        return status ? ResponseEntity.ok(true) : ResponseEntity.badRequest().body(false);
    }
}