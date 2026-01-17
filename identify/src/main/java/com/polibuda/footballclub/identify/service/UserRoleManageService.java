package com.polibuda.footballclub.identify.service;

import com.polibuda.footballclub.common.UserRole;
import com.polibuda.footballclub.common.dto.UpdateUserRequest;
import com.polibuda.footballclub.common.dto.UpdateUserRoleRequestDTO;
import com.polibuda.footballclub.common.dto.UserResponseDTO;
import com.polibuda.footballclub.common.dto.UserRoleDTO;
import com.polibuda.footballclub.identify.entity.Role;
import com.polibuda.footballclub.identify.entity.User;
import com.polibuda.footballclub.identify.repository.RoleRepository;
import com.polibuda.footballclub.identify.repository.UserRepository;
import com.polibuda.identify.grpc.RoleAssignmentStatus;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserRoleManageService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    /**
     * Pobiera role użytkownika.
     * Transactional(readOnly = true) optymalizuje wydajność i zapewnia sesję Hibernate.
     */
    @Transactional(readOnly = true)
    public List<String> getUserRoles(long userId) {
        return userRepository.findByIdWithRoles(userId)
                .map(user -> user.getRoles().stream()
                        .map(Role::getName)
                        .toList()) // Java 16+ toList()
                .orElse(Collections.emptyList());
    }

    @Transactional(readOnly = true)
    public UserResponseDTO getUserDTO(long userId) {
        User user =  userRepository.findByIdWithRoles(userId).orElseThrow();
        Set<UserRoleDTO> roles =  user.getRoles().stream().map(this::mapToDTO).collect(Collectors.toSet());
        return UserResponseDTO.builder()
                .userId(user.getId())
                .userEmail(user.getEmail())
                .userName(user.getUsername())
                .createdAt(user.getCreatedAt()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDateTime())
                .userRole(roles)
                .enabled(user.getEnabled())
                .accountNonLocked(user.getAccountNonLocked())
                .build();
    }

    @Transactional
    public void updateUser(UpdateUserRequest request, Long userId) {
        if (request == null) {
            throw new IllegalArgumentException("UpdateUserRequest must not be null");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "User with id " + userId + " not found"));

        if (request.getUsername() != null) {
            userRepository.findByUsername(request.getUsername())
                    .filter(u -> !u.getId().equals(user.getId()))
                    .ifPresent(u -> {
                        throw new IllegalArgumentException("Username already exists");
                    });
            user.setUsername(request.getUsername());
        }

        if (request.getEmail() != null) {
            userRepository.findByEmail(request.getEmail())
                    .filter(u -> !u.getId().equals(user.getId()))
                    .ifPresent(u -> {
                        throw new IllegalArgumentException("Email already exists");
                    });
            user.setEmail(request.getEmail());
        }
    }




    /**
     * Nadaje role.
     * Logika decyduje, czy operacja się udała, czy wymagany jest rollback w serwisie wołającym.
     */
    @Transactional
    public RoleAssignmentResult grantRolesToUser(long userId, List<String> roleNames) {
        Optional<User> userOpt = userRepository.findById(userId);

        if (userOpt.isEmpty()) {
            log.warn("User ID {} not found. Triggering SAGA rollback.", userId);
            return new RoleAssignmentResult(
                    RoleAssignmentStatus.FAILURE_ROLLBACK_REQUIRED,
                    "User with ID " + userId + " does not exist."
            );
        }

        User user = userOpt.get();
        List<String> added = new ArrayList<>();
        List<String> skipped = new ArrayList<>();

        for (String roleName : roleNames) {
            Optional<Role> roleOpt = roleRepository.findByName(roleName);
            if (roleOpt.isPresent()) {
                user.getRoles().add(roleOpt.get());
                added.add(roleName);
            } else {
                skipped.add(roleName);
            }
        }

        String msg = String.format("Success: %s. Skipped: %s", added, skipped);
        log.info("Updated roles for user {}: {}", userId, msg);

        return new RoleAssignmentResult(RoleAssignmentStatus.SUCCESS, msg);
    }
    @Transactional
    public RoleAssignmentResult removeRolesFromUser(long userId, List<String> roleNames) {
        Optional<User> userOpt = userRepository.findById(userId);

        if (userOpt.isEmpty()) {
            log.warn("User ID {} not found. Triggering SAGA rollback.", userId);
            return new RoleAssignmentResult(
                    RoleAssignmentStatus.FAILURE_ROLLBACK_REQUIRED,
                    "User with ID " + userId + " does not exist."
            );
        }

        User user = userOpt.get();
        List<String> removed = new ArrayList<>();
        List<String> skipped = new ArrayList<>();

        for (String roleName : roleNames) {
            Optional<Role> roleOpt = roleRepository.findByName(roleName);
            if (roleOpt.isPresent()) {
                user.getRoles().remove(roleOpt.get());
                removed.add(roleName);
            } else {
                skipped.add(roleName);
            }
        }


        String msg = String.format("Success: %s. Skipped: %s", removed, skipped);
        log.info("Updated roles for user {}: {}", userId, msg);

        return new RoleAssignmentResult(RoleAssignmentStatus.SUCCESS, msg);

    }
    private UserRoleDTO mapToDTO(Role role) {
        return UserRoleDTO.builder()
                .description(role.getDescription())
                .role(role.getName())
                .build();
    }

    public record RoleAssignmentResult(RoleAssignmentStatus status, String message) {}
}