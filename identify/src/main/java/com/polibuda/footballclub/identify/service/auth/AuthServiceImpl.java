package com.polibuda.footballclub.identify.service.auth;

import com.polibuda.footballclub.common.dto.*;
import com.polibuda.footballclub.identify.entity.Role;
import com.polibuda.footballclub.identify.entity.User;
import com.polibuda.footballclub.identify.repository.RoleRepository;
import com.polibuda.footballclub.identify.repository.UserRepository;
import com.polibuda.footballclub.identify.service.actiavte.ActivateService;
import com.polibuda.footballclub.identify.service.token.JwtAccessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtAccessService jwtService;
    private final AuthenticationManager authenticationManager;
    private final ActivateService activateService; // Wstrzykujemy interfejs

    private static final String DEFAULT_ROLE = "ROLE_USER";

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        try {
            if (userRepository.existsByUsername(request.getUsername())) {
                return RegisterResponse.builder().success(false).message("Username already exists").timestamp(LocalDateTime.now()).build();
            }

            Role userRole = roleRepository.findByName(DEFAULT_ROLE)
                    .orElseThrow(() -> new RuntimeException("Default role not found"));

            User user = User.builder()
                    .username(request.getUsername())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .roles(new HashSet<>(Set.of(userRole)))
                    .email(request.getEmail())
                    .enabled(false)
                    .build();

            userRepository.save(user);

            // Delegacja wysyłki kodu
            activateService.sendActivationCode(user.getEmail(), user.getUsername());

            return RegisterResponse.builder().success(true).message("User registered successfully").timestamp(LocalDateTime.now()).build();

        } catch (Exception e) {
            log.error("Registration error", e);
            return RegisterResponse.builder().success(false).message("Registration failed: " + e.getMessage()).timestamp(LocalDateTime.now()).build();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        try {
            // Sprawdzenie stanu konta przed autentykacją springową
            User user = userRepository.findByEmail(request.getEmail()).orElseThrow();

            if (user != null && !user.getEnabled()) {
                activateService.sendAccountNotVerifiedReminder(user.getEmail(), user.getUsername());
                return LoginResponse.builder().success(false).message("Account not activated. Check email.").timestamp(LocalDateTime.now()).build();
            }

            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            String token = jwtService.generateToken(user);

            return LoginResponse.builder().success(true).message("Login successful").token(token).timestamp(LocalDateTime.now()).build();

        } catch (BadCredentialsException e) {
            return LoginResponse.builder().success(false).message("Invalid credentials").timestamp(LocalDateTime.now()).build();
        } catch (Exception e) {
            log.error("Login error", e);
            return LoginResponse.builder().success(false).message("Login failed").timestamp(LocalDateTime.now()).build();
        }
    }

    @Override
    public RefreshTokenResponse refreshToken(RefreshTokenRequest request) {
        // ... (Twoja logika bez zmian)
        try {
            if (!jwtService.validateToken(request.getRefreshToken())) {
                return RefreshTokenResponse.builder().success(false).message("Invalid token").build();
            }
            String username = jwtService.extractUsername(request.getRefreshToken());
            User user = userRepository.findByUsername(username).orElseThrow();
            String newToken = jwtService.generateToken(user);

            return RefreshTokenResponse.builder().success(true).token(newToken).timestamp(LocalDateTime.now()).build();
        } catch (Exception e) {
            return RefreshTokenResponse.builder().success(false).message(e.getMessage()).build();
        }
    }
}