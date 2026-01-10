package com.polibuda.footballclub.football_external_data.aop;

import com.polibuda.footballclub.football_external_data.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditLogService auditLogService;

    // Pointcut na metody oznaczone naszą adnotacją
    @Pointcut("@annotation(com.polibuda.footballclub.football_external_data.aop.Auditable)")
    public void auditableMethods() {}

    @AfterReturning(pointcut = "auditableMethods() && @annotation(auditable)", returning = "result")
    public void logAuditActivity(JoinPoint joinPoint, Auditable auditable, Object result) {
        try {
            String currentUserId = getCurrentUser();

            Object[] args = joinPoint.getArgs();
            String details = auditable.description() + " [Args: " + Arrays.toString(args) + "]";

            // 3. Zapisz log
            auditLogService.saveLog(
                    currentUserId,
                    auditable.actionType(),
                    auditable.resourceName(),
                    details
            );
        } catch (Exception e) {
            log.error("Failed to save audit log", e);
        }
    }

    private String getCurrentUser() {
        // TODO: Wpiąć Spring Security: SecurityContextHolder.getContext().getAuthentication().getName();
        return "ADMIN_USER"; // Placeholder
    }
}