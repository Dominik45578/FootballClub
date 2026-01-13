package com.polibuda.footballclub.identify.service;

import com.polibuda.footballclub.identify.entity.Role;
import com.polibuda.footballclub.identify.entity.User;
import com.polibuda.footballclub.identify.repository.RoleRepository;
import com.polibuda.footballclub.identify.repository.UserRepository;
import com.polibuda.identify.grpc.RoleAssignmentStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

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

        // JPA Dirty Checking zapisze zmiany przy zamknięciu transakcji
        // user.getRoles() jest kolekcją zarządzaną

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

        // JPA Dirty Checking zapisze zmiany przy zamknięciu transakcji
        // user.getRoles() jest kolekcją zarządzaną

        String msg = String.format("Success: %s. Skipped: %s", removed, skipped);
        log.info("Updated roles for user {}: {}", userId, msg);

        return new RoleAssignmentResult(RoleAssignmentStatus.SUCCESS, msg);

    }

    public record RoleAssignmentResult(RoleAssignmentStatus status, String message) {}
}