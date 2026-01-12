package com.polibuda.footballclub.match.config;

import com.polibuda.footballclub.football_external_data.grpc.FootballDataServiceGrpc;
import io.grpc.ManagedChannel;
import io.grpc.netty.shaded.io.grpc.netty.NettyChannelBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Slf4j
@Configuration
public class GrpcClientConfig {

    // Adres serwisu "football-external-data"
    @Value("${grpc.football-data.host}")
    private String host;

    @Value("${grpc.football-data.port}")
    private int port;

    /**
     * Bean 1: ManagedChannel
     * To jest fizyczne połączenie (socket TCP/HTTP2).
     * Musi być Beanem, aby Spring zarządzał jego cyklem życia (zamknięcie przy stopie aplikacji).
     */
    @Bean(destroyMethod = "shutdown")
    public ManagedChannel footballDataChannel() {
        log.info("Creating gRPC Channel to {}:{}", host, port);
        
        return NettyChannelBuilder.forAddress(host, port)
                .usePlaintext() // Wyłączamy SSL dla komunikacji wewnętrznej
                .keepAliveTime(30, TimeUnit.SECONDS) // Pingowanie połączenia, żeby Load Balancer go nie ubił
                .build();
    }

    /**
     * Bean 2: BlockingStub
     * To jest ten obiekt, którego Spring szukał i nie mógł znaleźć.
     * Wstrzykujemy tu kanał utworzony metodę wyżej.
     */
    @Bean
    public FootballDataServiceGrpc.FootballDataServiceBlockingStub footballDataStub(ManagedChannel channel) {
        return FootballDataServiceGrpc.newBlockingStub(channel);
    }
}