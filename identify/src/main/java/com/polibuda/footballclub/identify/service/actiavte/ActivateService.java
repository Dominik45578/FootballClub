package com.polibuda.footballclub.identify.service.actiavte;

import com.polibuda.footballclub.common.dto.ActivateRequest;
import com.polibuda.footballclub.common.dto.ActivateResponse;

public interface ActivateService {
    ActivateResponse activateAccount(ActivateRequest request);
    boolean sendActivationCode(String email, String username);
    void sendAccountNotVerifiedReminder(String email, String username);
}