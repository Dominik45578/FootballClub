package com.polibuda.footballclub.user.config;

import com.polibuda.footballclub.user.exceptions.InsufficientPermissionsException;
import com.polibuda.footballclub.user.exceptions.business.BusinessLogicException;
import com.polibuda.footballclub.user.exceptions.business.TeamAlreadyExistExceptions;
import com.polibuda.footballclub.user.exceptions.notFound.ResourceNotFoundException;
import com.polibuda.footballclub.user.model.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ==================================================================================
    // 1. NOT FOUND (404) - Zasób nie istnieje
    // ==================================================================================

    // Obsługuje: TeamNotFoundException, MemberNotFoundException, TeamMemberNotFoundException
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    // ==================================================================================
    // 2. CONFLICT (409) - Błędy biznesowe i spójności danych
    // ==================================================================================

    // Obsługuje: UserAlreadyInTeamException, UserAlreadyVerified, MemberAlreadyExistExceptions
    // ORAZ TeamAlreadyExistExceptions (który nie dziedziczy po BusinessLogicException)
    @ExceptionHandler({BusinessLogicException.class, TeamAlreadyExistExceptions.class})
    public ResponseEntity<ApiErrorResponse> handleBusinessConflict(RuntimeException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    // Obsługa Optimistic Locking (Twój błąd z poprzedniego pytania)
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ApiErrorResponse> handleOptimisticLocking(ObjectOptimisticLockingFailureException ex, HttpServletRequest request) {
        log.warn("Optimistic locking failure detected at {}", request.getRequestURI());
        return buildResponse(HttpStatus.CONFLICT, "Dane zostały zmienione przez innego użytkownika. Odśwież i spróbuj ponownie.", request);
    }

    // Obsługa unikalności w bazie (np. zduplikowany PESEL lub user_id, który przeszedł walidację w kodzie)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn("Database constraint violation at {}", request.getRequestURI());
        // Nie wysyłamy exception message z bazy, bo to ujawnia strukturę tabel. Dajemy ogólny komunikat.
        return buildResponse(HttpStatus.CONFLICT, "Operacja narusza spójność danych (np. duplikat).", request);
    }

    // ==================================================================================
    // 3. FORBIDDEN (403) - Brak uprawnień
    // ==================================================================================

    // Twoje customowe wyjątki (Contextual Security)
    @ExceptionHandler(InsufficientPermissionsException.class)
    public ResponseEntity<ApiErrorResponse> handleCustomAccessDenied(InsufficientPermissionsException ex, HttpServletRequest request) {
        log.warn("Security alert: Unauthorized business action attempt at {}", request.getRequestURI());
        return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage(), request);
    }

    // Standardowe wyjątki Spring Security (np. @PreAuthorize)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleSpringAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        log.warn("Security alert: Access denied by Spring Security at {}", request.getRequestURI());
        return buildResponse(HttpStatus.FORBIDDEN, "Access Denied: Nie masz wystarczających uprawnień.", request);
    }

    // ==================================================================================
    // 4. BAD REQUEST (400) - Błędy walidacji i formatowania
    // ==================================================================================

    // Walidacja @Valid na obiektach DTO
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String detailedMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining(", "));

        return buildResponse(HttpStatus.BAD_REQUEST, "Błąd walidacji: " + detailedMessage, request);
    }

    // Błędny JSON (np. przecinek zamiast kropki w Double, zły format daty)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleMalformedJson(HttpMessageNotReadableException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Niepoprawny format żądania (JSON) lub błąd deserializacji.", request);
    }

    // Zły typ parametru w URL (np. litery w miejscu Long ID)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Niepoprawny typ parametru: " + ex.getName(), request);
    }

    // ==================================================================================
    // 5. INTERNAL SERVER ERROR (500) - Nieoczekiwane błędy (Safety Net)
    // ==================================================================================

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneric(Exception ex, HttpServletRequest request) {
        // Tu logujemy ERROR ze stacktracem, bo to błąd programisty/serwera
        log.error("CRITICAL UNEXPECTED ERROR at {}: ", request.getRequestURI(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Wystąpił nieoczekiwany błąd serwera. Skontaktuj się z administratorem.", request);
    }

    // --- Helper ---

    private ResponseEntity<ApiErrorResponse> buildResponse(HttpStatus status, String message, HttpServletRequest request) {
        return ResponseEntity.status(status).body(ApiErrorResponse.builder()
                .timestamp(Instant.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .path(request.getRequestURI())
                .build());
    }
}