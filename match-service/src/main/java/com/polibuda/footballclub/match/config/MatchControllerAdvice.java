package com.polibuda.footballclub.match.config;

import com.polibuda.footballclub.match.exceptions.*;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@Slf4j
@RestControllerAdvice
public class MatchControllerAdvice {

    // Prosty rekord/klasa do struktury błędu
    @Data
    @Builder
    public static class ErrorResponse {
        private String timestamp;
        private int status;
        private String error;
        private String message;
        private String path; // Opcjonalnie
    }

    // --- Obsługa Twoich wyjątków biznesowych ---

    @ExceptionHandler(MatchDateConflictException.class)
    public ResponseEntity<ErrorResponse> handleDateConflict(MatchDateConflictException ex) {
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler({
            InvalidTeamPairingException.class,
            InvalidMatchStatusTransitionException.class,
            InvalidMatchScoreException.class,
            MatchDateInPastException.class,
            TeamMustBeActiveException.class // Ten już miałeś
    })
    public ResponseEntity<ErrorResponse> handleBadRequest(MatchSerwisExceptions ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler({
            MatchNotFoundExceptions.class,
            ResourceNotFoundException.class,
            ExternalTeamMustExistException.class
    })
    public ResponseEntity<ErrorResponse> handleNotFound(MatchSerwisExceptions ex) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(InsufficientPermissionsException.class)
    public ResponseEntity<ErrorResponse> handleForbidden(InsufficientPermissionsException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    // --- Fallback dla nieprzewidzianych błędów (Unikanie "gołego" 500) ---
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        log.error("Unexpected error occurred: ", ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected internal error occurred. Please contact support.");
    }

    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String message) {
        return ResponseEntity
                .status(status)
                .body(ErrorResponse.builder()
                        .timestamp(LocalDateTime.now().toString())
                        .status(status.value())
                        .error(status.getReasonPhrase())
                        .message(message)
                        .build());
    }
}