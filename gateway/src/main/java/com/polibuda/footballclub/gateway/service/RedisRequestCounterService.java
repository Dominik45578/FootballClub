package com.polibuda.footballclub.gateway.service;

import reactor.core.publisher.Mono;

public interface RedisRequestCounterService {
    Mono<Integer> getRequestCount(String userId);

    Mono<Long> incrementRequestCounter(String userId);
    // Remove i add zazwyczaj nie są potrzebne przy podejściu z increment
}