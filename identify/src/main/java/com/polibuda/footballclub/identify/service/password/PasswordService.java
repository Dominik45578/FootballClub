package com.polibuda.footballclub.identify.service.password;

import com.polibuda.footballclub.common.dto.NewPasswordRequest;
import com.polibuda.footballclub.common.dto.NewPasswordResponse;
import com.polibuda.footballclub.common.dto.ResetPasswordRequest;
import com.polibuda.footballclub.common.dto.ResetPasswordResponse;

public interface PasswordService {
    ResetPasswordResponse initiatePasswordReset(ResetPasswordRequest request);
    NewPasswordResponse changePassword(NewPasswordRequest request);
}