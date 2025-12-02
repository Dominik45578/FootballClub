package com.polibuda.footballclub.identify.service.auth;

import com.polibuda.footballclub.common.dto.*;

public interface AuthService {
    RegisterResponse register(RegisterRequest request);
    LoginResponse login(LoginRequest request);
    RefreshTokenResponse refreshToken(RefreshTokenRequest request);
}