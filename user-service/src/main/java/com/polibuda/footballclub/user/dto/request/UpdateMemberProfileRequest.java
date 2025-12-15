package com.polibuda.footballclub.user.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMemberProfileRequest {

    // Używamy Double wrapperów, bo pola mogą być opcjonalne (null)
    @DecimalMin(value = "100.0", message = "Wzrost musi być realny (min 100 cm)")
    @DecimalMax(value = "250.0", message = "Wzrost musi być realny (max 250 cm)")
    private Double height;

    @DecimalMin(value = "30.0", message = "Waga musi być realna (min 30 kg)")
    @DecimalMax(value = "200.0", message = "Waga musi być realna (max 200 kg)")
    private Double weight;

    @Pattern(regexp = "^\\+?[0-9]{9,15}$", message = "Niepoprawny format numeru telefonu")
    private String phoneNumber;
}