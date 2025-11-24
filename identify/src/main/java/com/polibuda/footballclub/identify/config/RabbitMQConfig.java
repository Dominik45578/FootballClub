package com.polibuda.footballclub.identify.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    
    // Nazwy queue i exchange
    public static final String NOTIFICATION_QUEUE = "notification.queue";
    public static final String NOTIFICATION_EXCHANGE = "notification.exchange";
    public static final String NOTIFICATION_ROUTING_KEY = "notification.email";
    
    /**
     * Queue dla wiadomości email
     */
    @Bean
    public Queue notificationQueue() {
        return new Queue(NOTIFICATION_QUEUE, true); // durable = true
    }
    
    /**
     * Exchange typu Topic
     */
    @Bean
    public TopicExchange notificationExchange() {
        return new TopicExchange(NOTIFICATION_EXCHANGE);
    }
    
    /**
     * Binding - połączenie queue z exchange
     */
    @Bean
    public Binding notificationBinding(Queue notificationQueue, TopicExchange notificationExchange) {
        return BindingBuilder
                .bind(notificationQueue)
                .to(notificationExchange)
                .with(NOTIFICATION_ROUTING_KEY);
    }
    
    /**
     * Converter JSON - automatyczna serializacja obiektów
     */
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
    
    /**
     * RabbitTemplate z JSON converterem
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
