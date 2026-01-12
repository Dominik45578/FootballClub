package com.polibuda.footballclub.football_external_data.aop;

import com.polibuda.footballclub.football_external_data.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Optional;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditLogService auditLogService;
    private static final String SYSTEM_USER = "SYSTEM";

    @Pointcut("@annotation(com.polibuda.footballclub.football_external_data.aop.Auditable)")
    public void auditableMethods() {}

    @AfterReturning(pointcut = "auditableMethods() && @annotation(auditable)", returning = "result")
    public void logAuditActivity(JoinPoint joinPoint, Auditable auditable, Object result) {
        try {
            String currentUserId = getCurrentUser();

            Object[] args = joinPoint.getArgs();
            String details = auditable.description() + " [Args: " + Arrays.toString(args) + "]";

            auditLogService.saveLog(
                    currentUserId,
                    auditable.actionType(),
                    auditable.resourceName(),
                    details
            );
        } catch (Exception e) {
            // Łapiemy wyjątki, aby błąd logowania nie przerwał logiki biznesowej
            log.error("Failed to save audit log for method: {}", joinPoint.getSignature().toShortString(), e);
        }
    }

    /**
     * Pobiera ID użytkownika z SecurityContextHolder.
     * W Twoim UserAuthenticationFilter principal jest ustawiany jako Long.
     */
    private String getCurrentUser() {
        return Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                .filter(auth -> !(auth instanceof AnonymousAuthenticationToken)) // Ignoruj użytkowników anonimowych
                .filter(Authentication::isAuthenticated)
                .map(Authentication::getPrincipal)
                .map(String::valueOf) // Konwersja Long -> String
                .orElse(SYSTEM_USER);
    }
}