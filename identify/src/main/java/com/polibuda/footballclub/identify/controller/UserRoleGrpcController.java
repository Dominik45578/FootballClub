package com.polibuda.footballclub.identify.controller;

import com.polibuda.footballclub.identify.service.UserRoleManageService;
import com.polibuda.identify.grpc.*;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service // Kluczowe: Rejestruje Bean, który wpadnie do listy BindableService w konfigu
@RequiredArgsConstructor
public class UserRoleGrpcController extends UserRoleServiceGrpc.UserRoleServiceImplBase {

    private final UserRoleManageService userRoleManageService;

    @Override
    public void grantRoles(GrantRolesRequest request, StreamObserver<GrantRolesResponse> responseObserver) {
        log.info("gRPC call: grantRoles for user_id: {}", request.getUserId());
        
        try {
            // Delegacja do logiki biznesowej
            UserRoleManageService.RoleAssignmentResult result = 
                userRoleManageService.grantRolesToUser(request.getUserId(), request.getRolesList());

            // Budowanie odpowiedzi
            GrantRolesResponse response = GrantRolesResponse.newBuilder()
                    .setStatus(result.status())
                    .setMessage(result.message())
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("Error in grantRoles", e);
            // Przekazanie błędu jako status gRPC INTERNAL
            responseObserver.onError(io.grpc.Status.INTERNAL
                .withDescription("Internal server error: " + e.getMessage())
                .asRuntimeException());
        }
    }

    @Override
    public void getUserRoles(GetUserRolesRequest request, StreamObserver<GetUserRolesResponse> responseObserver) {
        log.info("gRPC call: getUserRoles for user_id: {}", request.getUserId());
        
        try {
            var roles = userRoleManageService.getUserRoles(request.getUserId());

            GetUserRolesResponse response = GetUserRolesResponse.newBuilder()
                    .setUserId(request.getUserId())
                    .addAllRoles(roles)
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("Error in getUserRoles", e);
            responseObserver.onError(io.grpc.Status.INTERNAL
                .withDescription("Error fetching roles")
                .asRuntimeException());
        }
    }

    @Override
    public void removeRoles(RemoveRolesRequest request, StreamObserver<RemoveRolesResponse> responseObserver) {
        log.info("gRPC call: removeRoles for user_id: {}", request.getUserId());

        try {
            UserRoleManageService.RoleAssignmentResult result =
                    userRoleManageService.removeRolesFromUser(request.getUserId(), request.getRolesList());

            RemoveRolesResponse response = RemoveRolesResponse.newBuilder()
                    .setStatus(result.status())
                    .setMessage(result.message())
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("Error in grantRoles", e);
            responseObserver.onError(io.grpc.Status.INTERNAL
                    .withDescription("Internal server error: " + e.getMessage())
                    .asRuntimeException());
        }
    }
}