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

@RestController
@RequestMapping("/auth")
@AllArgsConstructor
public class RoleController {
    UserRoleManageService userRoleManageService;

    @GetMapping("/me")
    public UserResponseDTO me(
            @RequestHeader(MutationHeaderClaims.X_USER_ID) Long userId
    ) {
       return userRoleManageService.getUserDTO(userId);
    }
    @PostMapping("/me")
    public ResponseEntity<Void> update(
            @RequestBody UpdateUserRequest updateUserRequest,
            @RequestHeader(MutationHeaderClaims.X_USER_ID) Long userId
    ) {
        userRoleManageService.updateUser(updateUserRequest,userId);
        return ResponseEntity.ok().build();
    }

}
