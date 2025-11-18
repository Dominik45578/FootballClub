package com.polibuda.footballclub.identify.controller;


import com.polibuda.footballclub.common.dto.JwtResponse;
import com.polibuda.footballclub.common.dto.LoginRequest;
import com.polibuda.footballclub.common.dto.RegisterRequest;
import com.polibuda.footballclub.identify.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            authService.register(request);
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body("User registered successfully ✅");
        } catch (IllegalStateException e) {
            // np. użytkownik już istnieje
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Registration failed: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            JwtResponse jwt = authService.login(request);
            return ResponseEntity.ok(jwt);
        } catch (IllegalArgumentException e) {
            // np. błędne dane logowania
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Login failed: " + e.getMessage());
        }
    }
}