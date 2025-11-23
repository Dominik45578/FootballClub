package com.polibuda.footballclub.common.rabbitmq;

/**
 * Interface for messages sent through RabbitMQ
 */
public interface Message {
    /**
     * Get message content (email body)
     */
    String getContent();
    
    /**
     * Get recipient email address
     */
    String getRecipient();

    String getSubject();
}
