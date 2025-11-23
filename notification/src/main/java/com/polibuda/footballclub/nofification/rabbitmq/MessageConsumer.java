package com.polibuda.footballclub.nofification.rabbitmq;


import com.polibuda.footballclub.common.rabbitmq.EmailMessage;
import com.polibuda.footballclub.common.rabbitmq.Message;
import com.polibuda.footballclub.nofification.config.RabbitMQConfig;
import com.polibuda.footballclub.nofification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MessageConsumer {
    
    private final EmailService emailService;
    
    /**
     * Listen for messages from RabbitMQ and send emails
     */
    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_QUEUE)
    public void receiveMessage(Message message) {
        try {
            log.info("Received message: recipient={}, contentLength={}", 
                    message.getRecipient(), 
                    message.getContent().length());
            
            // Get recipient from message
            String recipient = message.getRecipient();
            
            // Get content from message
            String content = message.getContent();
            
            // Get subject if available
            String subject = "Notification from Football Club";
            if (message instanceof EmailMessage emailMessage) {
                subject = emailMessage.getSubject();
            }
            
            // Send email
            emailService.sendEmail(recipient, subject, content);
            
            log.info("Email sent successfully to {}", recipient);
            
        } catch (Exception e) {
            log.error("Failed to process message: {}", message, e);
            // Tutaj można dodać retry logic lub DLQ (Dead Letter Queue)
            throw new RuntimeException("Failed to send email", e);
        }
    }
}
