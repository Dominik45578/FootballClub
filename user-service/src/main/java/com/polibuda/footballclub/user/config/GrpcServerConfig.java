package com.polibuda.footballclub.user.config;

import io.grpc.BindableService;
import io.grpc.Server;
import io.grpc.netty.shaded.io.grpc.netty.NettyServerBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Configuration
public class GrpcServerConfig {

    @Value("${grpc.server.port:9094}")
    private int port;

    /**
     * Tworzymy Bean serwera. Spring automatycznie wstrzyknie tu LISTĘ wszystkich
     * komponentów, które implementują interfejs BindableService (czyli Twoje serwisy gRPC).
     * Dzięki temu nie musisz tu nic zmieniać, gdy dodasz nowy serwis.
     */
    @Bean(destroyMethod = "shutdown") // Spring wywoła shutdown() przy zamykaniu kontekstu
    public Server grpcServer(List<BindableService> grpcServices) throws IOException {
        log.info("Configuring gRPC Server with Netty Shaded on port {}", port);

        // Używamy dedykowanego NettyServerBuilder zamiast ogólnego ServerBuilder.
        // To gwarantuje, że użyjemy biblioteki shaded (odpornej na konflikty wersji).
        var serverBuilder = NettyServerBuilder.forPort(port);

        // Dynamicznie dodajemy wszystkie znalezione serwisy
        for (BindableService service : grpcServices) {
            serverBuilder.addService(service);
            log.info("Registered gRPC service: {}", service.getClass().getSimpleName());
        }

        // Budujemy serwer i od razu go uruchamiamy
        Server server = serverBuilder.build();
        server.start();
        
        log.info("gRPC Server started successfully.");
        return server;
    }

    /**
     * Rejestrujemy hook na zamknięcie JVM, aby elegancko poczekać na zakończenie wątków.
     * Metoda destroyMethod w @Bean załatwia shutdown(), ale tutaj możemy dodać awaitTermination.
     */
    @Bean
    public Thread shutdownHook(Server server) {
        Thread hook = new Thread(() -> {
            try {
                log.info("Shutting down gRPC server...");
                // Czekamy max 30 sekund na dokończenie requestów
                if (!server.isShutdown()) {
                     server.shutdown();
                }
                server.awaitTermination(30, TimeUnit.SECONDS);
                log.info("gRPC server stopped.");
            } catch (InterruptedException e) {
                log.error("gRPC server shutdown interrupted", e);
            }
        });
        Runtime.getRuntime().addShutdownHook(hook);
        return hook;
    }
}