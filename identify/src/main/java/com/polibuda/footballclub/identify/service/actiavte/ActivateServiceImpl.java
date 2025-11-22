package com.polibuda.footballclub.identify.service.actiavte;

import com.polibuda.footballclub.common.dto.ActivateRequest;
import com.polibuda.footballclub.common.dto.ActivateResponse;
import org.springframework.stereotype.Service;

@Service
public class ActivateServiceImpl implements ActivateService{
    @Override
    public boolean activate(ActivateRequest request) {
        return true;
    }
}
