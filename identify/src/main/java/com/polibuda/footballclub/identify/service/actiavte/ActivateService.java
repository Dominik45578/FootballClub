package com.polibuda.footballclub.identify.service.actiavte;

import com.polibuda.footballclub.common.actions.UserAccountAction;
import com.polibuda.footballclub.common.dto.ActivateRequest;
import com.polibuda.footballclub.common.dto.ActivateResponse;
import com.polibuda.footballclub.common.dto.ResendCodeRequest;

public interface ActivateService {
    ActivateResponse activateAccount(ActivateRequest request);
    boolean sendActivationCode(String email, String username);
    void sendAccountNotVerifiedReminder(String email, String username);
    boolean resendActivationCode(ResendCodeRequest request);
}