package com.polibuda.footballclub.common.rabbitmq;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@ToString
@Builder
public class EmailMessage implements Message {
    
    private final String content;
    private final String recipient;
    private final String subject;
    
    @JsonCreator
    public EmailMessage(
            @JsonProperty("content") String content,
            @JsonProperty("recipient") String recipient,
            @JsonProperty("subject") String subject) {
        this.content = content;
        this.recipient = recipient;
        this.subject = subject;
    }
}
