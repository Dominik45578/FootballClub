package com.polibuda.footballclub.identify.service;


import com.polibuda.footballclub.common.dto.JwtResponse;
import com.polibuda.footballclub.common.dto.LoginRequest;
import com.polibuda.footballclub.common.dto.RegisterRequest;
import com.polibuda.footballclub.identify.config.JwtService;
import com.polibuda.footballclub.identify.entity.Role;
import com.polibuda.footballclub.identify.entity.User;
import com.polibuda.footballclub.identify.repository.RoleRepository;
import com.polibuda.footballclub.identify.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RoleRepository roleRepository;

    @Transactional
    public void register(RegisterRequest request) {
        Role roleUser = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("Role not found!"));

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(Set.of(roleUser))
                .build();

        userRepository.save(user);
    }


    public JwtResponse login(LoginRequest request) {
        var user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        return new JwtResponse(jwtService.generateToken(user.getUsername()));
    }
}