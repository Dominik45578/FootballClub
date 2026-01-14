package com.polibuda.footballclub.gateway.service;

import com.polibuda.footballclub.common.UserRole;
import com.polibuda.identify.grpc.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Stream;

/**
 * Fasada dla komunikacji gRPC z systemem tożsamości.
 * Tłumaczy obiekty domenowe na Proto i odwrotnie.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class IdentityGrpcClient {

    private final UserRoleServiceGrpc.UserRoleServiceBlockingStub identityStub;

    /**
     * Wysyła żądanie nadania ról.
     * Zwraca wynik operacji, który pozwala podjąć decyzję o ewentualnym rollbacku.
     */
    public UserBlockedResult isUserBlocked(Long userId){
        log.debug("gRPC Client : checking user status {}", userId);
        try{
            UserBlockedRequest request = UserBlockedRequest.newBuilder()
                    .setUserId(userId)
                    .build();
            UserBlockedResponse response = identityStub.isBlocked(request);

            return new UserBlockedResult(
                    response.getIsBlocked()
            );
        }catch (Exception e){
            log.error("gRPC call failed for checking ", e);
            return new UserBlockedResult(false);
        }
    }
    public RoleGrantResult grantRoles(Long userId, UserRole... roles) {
        log.debug("gRPC Client: Granting roles {} to user {}", roles, userId);
        List<String> mapped = Stream.of(roles).map(Enum::name).toList();

        try {
            GrantRolesRequest request = GrantRolesRequest.newBuilder()
                    .setUserId(userId)
                    .addAllRoles(mapped)
                    .build();

            GrantRolesResponse response = identityStub.grantRoles(request);

            return new RoleGrantResult(
                    mapStatus(response.getStatus()),
                    response.getMessage()
            );

        } catch (Exception e) {
            log.error("gRPC call failed for grantRoles", e);
            // W razie błędu sieciowego zakładamy najgorsze - retry lub rollback zależnie od strategii
            return new RoleGrantResult(RoleAssignmentStatusDTO.FAILURE_RETRYABLE, e.getMessage());
        }
    }

    /**
     * Pobiera role użytkownika.
     */
    public List<UserRole> getUserRoles(Long userId) {
        log.debug("gRPC Client: Fetching roles for user {}", userId);

        GetUserRolesRequest request = GetUserRolesRequest.newBuilder()
                .setUserId(userId)
                .build();

        // Blocking stub czeka na odpowiedź
        GetUserRolesResponse response = identityStub.getUserRoles(request);
        return response.getRolesList().stream().map(UserRole::valueOf).toList();
    }

    // --- Pomocnicze mapowanie i DTO ---

    private RoleAssignmentStatusDTO mapStatus(RoleAssignmentStatus protoStatus) {
        return switch (protoStatus) {
            case SUCCESS -> RoleAssignmentStatusDTO.SUCCESS;
            case FAILURE_ROLLBACK_REQUIRED -> RoleAssignmentStatusDTO.FAILURE_ROLLBACK_REQUIRED;
            case FAILURE_RETRYABLE -> RoleAssignmentStatusDTO.FAILURE_RETRYABLE;
            default -> RoleAssignmentStatusDTO.UNKNOWN;
        };
    }

    public RoleRemoveResult removeRoles(Long userId, UserRole... roles) {
        log.debug("gRPC Client: Removing roles {} to user {}", roles, userId);
        List<String> mapped = Stream.of(roles).map(Enum::name).toList();

        try {
            RemoveRolesRequest request = RemoveRolesRequest.newBuilder()
                    .setUserId(userId)
                    .addAllRoles(mapped)
                    .build();

            RemoveRolesResponse response = identityStub.removeRoles(request);

            return new RoleRemoveResult(
                    mapStatus(response.getStatus()),
                    response.getMessage()
            );

        } catch (Exception e) {
            log.error("gRPC call failed for grantRoles", e);
            return new RoleRemoveResult(RoleAssignmentStatusDTO.FAILURE_RETRYABLE, e.getMessage());
        }
    }

    public record RoleGrantResult(RoleAssignmentStatusDTO status, String message) {}
    public record RoleRemoveResult(RoleAssignmentStatusDTO status, String message) {}
    public record UserBlockedResult(boolean isBlocked) {}
    public enum RoleAssignmentStatusDTO {
        UNKNOWN, SUCCESS, FAILURE_ROLLBACK_REQUIRED, FAILURE_RETRYABLE
    }
}