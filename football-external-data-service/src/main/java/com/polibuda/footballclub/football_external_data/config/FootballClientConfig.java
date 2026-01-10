package com.polibuda.footballclub.football_external_data.config;

import com.polibuda.footballclub.football_external_data.model.FootballApiClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

@Configuration
public class FootballClientConfig {

    @Bean
    public FootballApiClient footballApiClient(RestClient.Builder builder, FedProperties properties) {
        RestClient restClient = builder
                .baseUrl(properties.getApiUrl())
                .defaultHeader(properties.getAuth().getHeader(), properties.getApiKey())
                .build();

        RestClientAdapter adapter = RestClientAdapter.create(restClient);
        HttpServiceProxyFactory factory = HttpServiceProxyFactory.builderFor(adapter).build();

        return factory.createClient(FootballApiClient.class);
    }
}