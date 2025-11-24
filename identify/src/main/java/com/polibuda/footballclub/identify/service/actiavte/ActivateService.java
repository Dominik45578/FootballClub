package com.polibuda.footballclub.identify.service.actiavte;

import com.polibuda.footballclub.common.dto.ActivateRequest;
import com.polibuda.footballclub.common.dto.ActivateResponse;
import com.polibuda.footballclub.common.dto.LoginRequest;

public interface ActivateService {
    boolean activate(ActivateRequest request);
    String generateCode(String email);
    void sendMail(LoginRequest request);

}
