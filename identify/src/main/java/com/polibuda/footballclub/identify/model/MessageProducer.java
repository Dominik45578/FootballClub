package com.polibuda.footballclub.identify.model;

import com.polibuda.footballclub.common.rabbitmq.Message;
import com.polibuda.footballclub.identify.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageProducer {
    
    private final RabbitTemplate rabbitTemplate;
    
    /**
     * Send message to notification service
     * 
     * @param message Message implementing Message interface
     */
    public void sendNotification(Message message) {
        try {
            log.info("Sending message to notification service: recipient={}, contentLength={}", 
                    message.getRecipient(), 
                    message.getContent().length());
            
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.NOTIFICATION_EXCHANGE,
                    RabbitMQConfig.NOTIFICATION_ROUTING_KEY,
                    message
            );
            
            log.info("Message sent successfully to {}", message.getRecipient());
        } catch (Exception e) {
            log.error("Failed to send message to notification service", e);
            throw new RuntimeException("Failed to send notification", e);
        }
    }
}
