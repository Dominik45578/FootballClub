package com.polibuda.footballclub.football_external_data.controller;

import com.polibuda.footballclub.football_external_data.dto.audit.AuditLogDTO;
import com.polibuda.footballclub.football_external_data.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("external/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogService auditLogService;

    @GetMapping("/logs")
    public ResponseEntity<List<AuditLogDTO>> getLatestLogs(@RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(auditLogService.getLastLogs(limit));
    }

    @GetMapping("/logs/{id}")
    public ResponseEntity<AuditLogDTO> getLogDetails(@PathVariable Long id) {
        return ResponseEntity.ok(auditLogService.getLogById(id));
    }
}