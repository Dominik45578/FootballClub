package com.polibuda.footballclub.football_external_data.dto.audit;


import com.polibuda.footballclub.common.actions.AuditActionType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;


@Data
@Builder
public class AuditLogDTO {
    private Long id;
    private String userId;
    private AuditActionType actionType;
    private String resourceName;
    private String details;
    private Instant timestamp;
}