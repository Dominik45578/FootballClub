package com.polibuda.footballclub.football_external_data.config;

import com.polibuda.footballclub.football_external_data.model.FootballApiClient;
import org.springframework.beans.factory.config.ConfigurableBeanFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

@Configuration
public class FootballClientConfig {

    @Bean
    public FootballApiClient footballApiClient(RestClient.Builder builder,
                                               FedProperties properties,
                                               ConfigurableBeanFactory beanFactory) { // 1. Wstrzykujemy fabrykę beanów
        RestClient restClient = builder
                //.baseUrl(properties.getApiUrl()) // 2. Odkomentuj to! Inaczej uderzysz w localhost zamiast w API
                .defaultHeader(properties.getAuth().getHeader(), properties.getApiKey())
                .build();

        RestClientAdapter adapter = RestClientAdapter.create(restClient);

        HttpServiceProxyFactory factory = HttpServiceProxyFactory.builderFor(adapter)
                .embeddedValueResolver(beanFactory::resolveEmbeddedValue) // 3. To jest kluczowe! Uczy proxy czytać ${...}
                .build();

        return factory.createClient(FootballApiClient.class);
    }
}