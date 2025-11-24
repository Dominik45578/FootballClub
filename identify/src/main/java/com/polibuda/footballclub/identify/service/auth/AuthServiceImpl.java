package com.polibuda.footballclub.identify.service.auth;

import com.polibuda.footballclub.common.dto.*;
import com.polibuda.footballclub.identify.RegisterCodeGenerator;
import com.polibuda.footballclub.identify.entity.Role;
import com.polibuda.footballclub.identify.entity.User;
import com.polibuda.footballclub.identify.redis.RedisUser;
import com.polibuda.footballclub.identify.repository.RoleRepository;
import com.polibuda.footballclub.identify.service.actiavte.ActivateService;
import com.polibuda.footballclub.identify.service.token.JwtAccessService;
import com.polibuda.footballclub.identify.service.user.UserService;
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

    private final UserService userService;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtAccessService jwtService;
    private final AuthenticationManager authenticationManager;
    private final ActivateService activateService;

    private static final String DEFAULT_ROLE = "ROLE_USER";

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        try {
            log.info("Registering new user: {}", request.getUsername());

            if (userService.existsByUsername(request.getUsername())) {
                return RegisterResponse.builder()
                        .success(false)
                        .message("Username already exists")
                        .timestamp(LocalDateTime.now())
                        .build();
            }

            Role userRole = roleRepository.findByName(DEFAULT_ROLE)
                    .orElseThrow(() -> new RuntimeException("Default role not found"));

            User user = User.builder()
                    .username(request.getUsername())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .roles(new HashSet<>(Set.of(userRole)))
                    .email(request.getEmail())
                    .build();


            userService.save(user);
            activateService.generateCode(request.getEmail());

            log.info("User registered successfully: {}", user.getUsername());
            return RegisterResponse.builder()
                    .success(true)
                    .message("User registered successfully")
                    .timestamp(LocalDateTime.now())
                    .build();

        } catch (Exception e) {
            log.error("Registration error for user: {}", request.getUsername(), e);
            return RegisterResponse.builder()
                    .success(false)
                    .message("Registration failed: " + e.getMessage())
                    .timestamp(LocalDateTime.now())
                    .build();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        try {
            log.info("User login attempt: {}", request.getEmail());
            User user = userService.findByEmail(request.getEmail());
            if(user.getEnabled()==false){
                activateService.sendMail(request);
            }
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );


            log.debug("User login successfully: {}", user.getUsername());
            String token = jwtService.generateToken(user);

            log.info("User logged in successfully: {}", user.getUsername());
            return LoginResponse.builder()
                    .success(true)
                    .message("Login successful")
                    .timestamp(LocalDateTime.now())
                    .token(token)
                    .build();

        } catch (BadCredentialsException e) {
            log.error("Invalid credentials for user: {}", request.getEmail());
            return LoginResponse.builder()
                    .success(false)
                    .message("Invalid username or password")
                    .timestamp(LocalDateTime.now())
                    .token(null)
                    .build();
        } catch (Exception e) {
            log.error("Login error for user: {}", request.getEmail(), e);
            return LoginResponse.builder()
                    .success(false)
                    .message("Login failed: " + e.getMessage())
                    .timestamp(LocalDateTime.now())
                    .token(null)
                    .build();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public RefreshTokenResponse refreshToken(RefreshTokenRequest request) {
        try {
            log.info("Refreshing token");

            if (!jwtService.validateToken(request.getRefreshToken())) {
                return RefreshTokenResponse.builder()
                        .success(false)
                        .message("Invalid or expired refresh token")
                        .timestamp(LocalDateTime.now())
                        .token(null)
                        .build();
            }

            String username = jwtService.extractUsername(request.getRefreshToken());
            User user = userService.findByUsername(username);
            String newToken = jwtService.generateToken(user);

            log.info("Token refreshed successfully for user: {}", username);
            return RefreshTokenResponse.builder()
                    .success(true)
                    .message("Token refreshed successfully")
                    .timestamp(LocalDateTime.now())
                    .token(newToken)
                    .build();

        } catch (Exception e) {
            log.error("Token refresh error", e);
            return RefreshTokenResponse.builder()
                    .success(false)
                    .message("Token refresh failed: " + e.getMessage())
                    .timestamp(LocalDateTime.now())
                    .token(null)
                    .build();
        }
    }

    @Override
    public ActivateResponse activate(ActivateRequest request) {
        log.info("Activating user account: {}", request.getEmail());
        if(!activateService.activate(request)) {
            log.error("Activation failed for user: {}", request.getEmail());
            return ActivateResponse.builder()
                    .success(false)
                    .message("Invalid creditionals")
                    .timestamp(LocalDateTime.now())
                    .build();
        }
        log.info("Activated user account: {}", request.getEmail());
        return ActivateResponse.builder()
                .success(true)
                .message("Activated successfully")
                .timestamp(LocalDateTime.now())
                .build();
    }
}
