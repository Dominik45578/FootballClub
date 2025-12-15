package com.polibuda.footballclub.user.dto.response.restricted;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberProfileResponse {

    private Long id;
    private String firstName;
    private String lastName;
    
    // To pole będzie zawierać wartość zamaskowaną, np. "90********12"
    private String maskedPesel; 
    
    private Instant birthDate;
    private String phoneNumber;
    private Double height;
    private Double weight;

    private Integer age;
}