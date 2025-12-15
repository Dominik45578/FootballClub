package com.polibuda.footballclub.user.config;

import com.polibuda.footballclub.user.exceptions.InsufficientPermissionsException;
import com.polibuda.footballclub.user.exceptions.business.BusinessLogicException;
import com.polibuda.footballclub.user.exceptions.notFound.ResourceNotFoundException;
import com.polibuda.footballclub.user.model.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // --- 404 NOT FOUND ---
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    // --- 409 CONFLICT / 400 BAD REQUEST (Logika biznesowa) ---
    @ExceptionHandler(BusinessLogicException.class)
    public ResponseEntity<ApiErrorResponse> handleBusinessLogic(BusinessLogicException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    // --- 403 FORBIDDEN (Brak uprawnień biznesowych) ---
    @ExceptionHandler(InsufficientPermissionsException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(InsufficientPermissionsException ex, HttpServletRequest request) {
        log.warn("Security alert: Unauthorized access attempt at {}", request.getRequestURI());
        return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage(), request);
    }

    // --- 400 BAD REQUEST (Walidacja @Valid) ---

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {

        // Tworzymy jeden ciąg znaków, np.: "phoneNumber: zły format, height: za duży"
        String detailedMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining(", "));

        return buildResponse(HttpStatus.BAD_REQUEST, "Validation failed: " + detailedMessage, request);
    }

    // --- 500 INTERNAL SERVER ERROR (Safety Net) ---
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneric(Exception ex, HttpServletRequest request) {
        log.error("CRITICAL UNEXPECTED ERROR: ", ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected internal error occurred.", request);
    }

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