package com.polibuda.footballclub.match.config;

import com.polibuda.footballclub.football_external_data.grpc.FootballDataServiceGrpc;
import com.polibuda.footballclub.match.grpc.MatchIntegrationServiceGrpc;
import com.polibuda.identify.grpc.UserRoleServiceGrpc;
import io.grpc.ManagedChannel;
import io.grpc.netty.shaded.io.grpc.netty.NettyChannelBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Slf4j
@Configuration
public class GrpcClientConfig {

    @Value("${grpc.football-data.host}")
    private String footballDataHost;

    @Value("${grpc.football-data.port}")
    private int footballDataPort;

    @Value("${grpc.user-service.host:user-service}")
    private String userServiceHost;

    @Value("${grpc.user-service.port:9095}")
    private int userServicePort;

    @Value("${grpc.football-data.port}")
    private int identifyServicePort;
    @Value("${grpc.match-service.host:match-service}")
    private String identifyServiceHost;

    @Bean(destroyMethod = "shutdown")
    public ManagedChannel footballDataChannel() {
        log.info("Creating gRPC Channel to FootballData Service at {}:{}", footballDataHost, footballDataPort);
        return createChannel(footballDataHost, footballDataPort);
    }

    @Bean(destroyMethod = "shutdown")
    public ManagedChannel matchIntegrationChannel() {
        log.info("Creating gRPC Channel to User Service (Match Integration) at {}:{}", userServiceHost, userServicePort);
        return createChannel(userServiceHost, userServicePort);
    }
    @Bean(destroyMethod = "shutdown")
    public ManagedChannel userRoleChannel() {
        log.info("Creating gRPC Channel to User Service (Match Integration) at {}:{}", identifyServiceHost, identifyServicePort);
        return createChannel(identifyServiceHost, identifyServicePort);
    }

    // Metoda pomocnicza, żeby nie powielać kodu konfiguracji Netty
    private ManagedChannel createChannel(String host, int port) {
        return NettyChannelBuilder.forAddress(host, port)
                .usePlaintext() // Wyłączamy SSL dla komunikacji wewnątrz klastra
                .keepAliveTime(30, TimeUnit.SECONDS)
                .build();
    }

    @Bean
    public FootballDataServiceGrpc.FootballDataServiceBlockingStub footballDataStub(
            @Qualifier("footballDataChannel") ManagedChannel channel) {
        return FootballDataServiceGrpc.newBlockingStub(channel);
    }

    @Bean
    public MatchIntegrationServiceGrpc.MatchIntegrationServiceBlockingStub matchIntegrationStub(
            @Qualifier("matchIntegrationChannel") ManagedChannel channel) {
        return MatchIntegrationServiceGrpc.newBlockingStub(channel);
    }

    @Bean
    public UserRoleServiceGrpc.UserRoleServiceBlockingStub identityStub(
            @Qualifier("userRoleChannel") ManagedChannel channel)
    {
        return UserRoleServiceGrpc.newBlockingStub(channel);
    }
}