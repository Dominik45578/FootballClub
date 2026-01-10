package com.polibuda.footballclub.football_external_data.service;

import com.polibuda.footballclub.common.actions.AuditActionType;
import com.polibuda.footballclub.football_external_data.dto.audit.AuditLogDTO;
import com.polibuda.footballclub.football_external_data.entity.AuditLogEntity;
import com.polibuda.footballclub.football_external_data.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveLog(String userId, AuditActionType actionType, String resource, String details) {
        AuditLogEntity log = AuditLogEntity.builder()
                .userId(userId)
                .actionType(actionType)
                .resourceName(resource)
                .details(details)
                .build();
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDTO> getLastLogs(int limit) {
        return auditLogRepository.findLatestLogs(PageRequest.of(0, limit)).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AuditLogDTO getLogById(Long id) {
        return auditLogRepository.findById(id)
                .map(this::mapToDTO)
                .orElseThrow(() -> new IllegalArgumentException("Log not found with id: " + id));
    }

    private AuditLogDTO mapToDTO(AuditLogEntity entity) {
        return AuditLogDTO.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .actionType(entity.getActionType())
                .resourceName(entity.getResourceName())
                .details(entity.getDetails())
                .timestamp(entity.getTimestamp())
                .build();
    }
}