package com.polibuda.footballclub.gateway.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.polibuda.footballclub.gateway.model.ErrorResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebFluxResponseHelper {

    private final ObjectMapper objectMapper;

    public Mono<Void> writeError(ServerWebExchange exchange, HttpStatus status, String error, String message) {
        ServerHttpResponse response = exchange.getResponse();

        // Zabezpieczenie: jeśli odpowiedź została już wysłana, nie rób nic
        if (response.isCommitted()) {
            return Mono.empty();
        }

        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        ErrorResponse errorBody = ErrorResponse.of(
                status.value(),
                error,
                message,
                exchange.getRequest().getPath().value()
        );

        try {
            byte[] bytes = objectMapper.writeValueAsBytes(errorBody);
            DataBuffer buffer = response.bufferFactory().wrap(bytes);
            return response.writeWith(Mono.just(buffer));
        } catch (Exception e) {
            log.error("Error writing JSON response", e);
            return Mono.error(e);
        }
    }
}