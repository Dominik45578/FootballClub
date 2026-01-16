package com.polibuda.footballclub.user.dto;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class UserDto {
    private Long userId;
    private String nickname;
    private String email;
    boolean nonBlocked;
}
