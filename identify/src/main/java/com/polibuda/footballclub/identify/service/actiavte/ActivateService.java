package com.polibuda.footballclub.identify.service.actiavte;

import com.polibuda.footballclub.common.dto.ActivateRequest;
import com.polibuda.footballclub.common.dto.ActivateResponse;

public interface ActivateService {
    boolean activate(ActivateRequest request);

}
