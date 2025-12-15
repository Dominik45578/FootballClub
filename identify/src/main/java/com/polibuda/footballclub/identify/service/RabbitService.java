package com.polibuda.footballclub.identify.service;

import com.polibuda.footballclub.common.rabbitmq.EmailMessage;
import com.polibuda.footballclub.common.rabbitmq.Message;
import com.polibuda.footballclub.common.rabbitmq.VerificationMessage;
import com.polibuda.footballclub.identify.model.MessageProducer;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@Data
@Builder
public class RabbitService {
    private MessageProducer messageProducer;

    boolean checkCreditionals(String creditionals){
        if(creditionals == null){
            log.error("Message recipient is null");
            return false;

        }
        return true;
    }

    boolean checkMessageData(String r, String m){
        return checkCreditionals(r) && checkCreditionals(m);
    }

    public void sendMessageWithVerificationCode(String recipient ,String content, String subject){
        log.info("Sending rabbit message : \nEmail {} \nSubject {} \nContent {}",recipient,subject,content);
        if(!checkMessageData(recipient, content)){
            log.error("Invalid message data");
            return;
        }
        messageProducer.sendNotification(
                VerificationMessage.builder()
                        .content(content)
                        .recipient(recipient)
                        .subject(subject==null?"FootballClubSystem":subject)
                        .build()
        );
        log.info("Message with verification code to {} sent to Notification-service successfully", recipient);
    }


}
