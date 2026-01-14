package com.polibuda.footballclub.identify.controller;

import com.polibuda.footballclub.common.UserRole;
import com.polibuda.footballclub.common.claims.MutationHeaderClaims;
import com.polibuda.footballclub.common.dto.UpdateUserRequest;
import com.polibuda.footballclub.common.dto.UpdateUserRoleRequestDTO;
import com.polibuda.footballclub.common.dto.UserResponseDTO;
import com.polibuda.footballclub.common.dto.UserRoleDTO;
import com.polibuda.footballclub.identify.entity.User;
import com.polibuda.footballclub.identify.service.UserRoleManageService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController("auth/me")
@AllArgsConstructor
public class RoleController {
    UserRoleManageService userRoleManageService;

    @GetMapping()
    public UserResponseDTO me(
            @RequestHeader(MutationHeaderClaims.X_USER_ID) Long userId
    ) {
       return userRoleManageService.getUserDTO(userId);
    }
    @PostMapping()
    public ResponseEntity<Boolean> update(
            @RequestBody UpdateUserRequest updateUserRequest,
            @RequestHeader(MutationHeaderClaims.X_USER_ID) Long userId
    ) {
        return userRoleManageService.updateUser(updateUserRequest,userId) ? ResponseEntity.ok().build() : ResponseEntity.badRequest().build();
    }
    @PatchMapping()
    public ResponseEntity<UserResponseDTO> changeRoles(
            @RequestHeader(MutationHeaderClaims.X_USER_ID) Long userId,
            @RequestBody UpdateUserRoleRequestDTO request
            ){
        return ResponseEntity.ok(userRoleManageService.updateUserRoles(request, userId));
    }




}
