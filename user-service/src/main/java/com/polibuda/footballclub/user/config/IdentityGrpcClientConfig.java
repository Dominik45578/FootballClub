package com.polibuda.footballclub.user.config;

import com.polibuda.identify.grpc.UserRoleServiceGrpc;
import io.grpc.ManagedChannel;
import io.grpc.netty.shaded.io.grpc.netty.NettyChannelBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Slf4j
@Configuration
public class IdentityGrpcClientConfig {

    @Value("${grpc.identify.host}")
    private String host;

    @Value("${grpc.identify.port}")
    private int port;

    /**
     * Kanał dedykowany dla serwisu Identity.
     * Używamy nazwy metody jako nazwy beana (identityChannel), aby Spring
     * odróżnił go od footballDataChannel przy wstrzykiwaniu.
     */
    @Bean(destroyMethod = "shutdown")
    public ManagedChannel identityChannel() {
        log.info("Creating gRPC Channel to Identity Service at {}:{}", host, port);

        return NettyChannelBuilder.forAddress(host, port)
                .usePlaintext() // Wewnątrz klastra (np. K8s) zazwyczaj nie szyfrujemy ruchu między podami
                .keepAliveTime(30, TimeUnit.SECONDS)
                .keepAliveTimeout(10, TimeUnit.SECONDS)
                .build();
    }

    /**
     * Stub blokujący (synchroniczny) dla UserRoleService.
     * To jego będziemy używać w kodzie biznesowym.
     */
    @Bean
    public UserRoleServiceGrpc.UserRoleServiceBlockingStub identityStub(ManagedChannel identityChannel) {
        // Spring automatycznie wstrzyknie bean 'identityChannel' zdefiniowany wyżej
        return UserRoleServiceGrpc.newBlockingStub(identityChannel);
    }

}