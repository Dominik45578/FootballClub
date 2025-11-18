package com.polibuda.footballclub.gateway.utils;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.polibuda.footballclub.gateway.model.ErrorResponse;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;


@Component
public class WebFluxResponseHelper {
    private final ObjectMapper mapper;


    public WebFluxResponseHelper(ObjectMapper mapper) {
        this.mapper = mapper;
    }


    public Mono<Void> writeError(ServerWebExchange exchange, HttpStatus status, String error, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        ErrorResponse body = new ErrorResponse(status.value(), error, message);
        byte[] bytes;
        try {
            bytes = mapper.writeValueAsBytes(body);
        } catch (Exception e) {
            bytes = ("{\"status\":" + status.value() + ",\"error\":\"" + error + "\",\"message\":\"" + message + "\"}").getBytes();
        }
        DataBufferFactory bufferFactory = response.bufferFactory();
        DataBuffer buf = bufferFactory.wrap(bytes);
        return response.writeWith(Mono.just(buf));
    }
}

