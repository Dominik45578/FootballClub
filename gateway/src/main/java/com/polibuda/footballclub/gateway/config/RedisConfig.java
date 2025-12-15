package com.polibuda.footballclub.gateway.config;

import com.polibuda.footballclub.gateway.redis.RedisToken;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    /**
     * Szablon do obsługi tokenów (zapisuje obiekty RedisToken jako JSON).
     */
    @Bean
    public ReactiveRedisTemplate<String, RedisToken> redisTokenTemplate(ReactiveRedisConnectionFactory factory) {
        StringRedisSerializer keySerializer = new StringRedisSerializer();
        // Dedykowany serializer dla Twojej klasy RedisToken
        Jackson2JsonRedisSerializer<RedisToken> valueSerializer = new Jackson2JsonRedisSerializer<>(RedisToken.class);

        RedisSerializationContext.RedisSerializationContextBuilder<String, RedisToken> builder =
                RedisSerializationContext.newSerializationContext(keySerializer);

        RedisSerializationContext<String, RedisToken> context = builder
                .value(valueSerializer)
                .build();

        return new ReactiveRedisTemplate<>(factory, context);
    }

    /**
     * Szablon ogólny (do liczników requestów itp.), operujący na Stringach.
     * Spring Boot często tworzy go automatycznie, ale warto mieć jawną definicję.
     */
    @Bean
    @Primary
    public ReactiveRedisTemplate<String, String> reactiveRedisTemplate(ReactiveRedisConnectionFactory factory) {
        return new ReactiveRedisTemplate<>(factory, RedisSerializationContext.string());
    }
}