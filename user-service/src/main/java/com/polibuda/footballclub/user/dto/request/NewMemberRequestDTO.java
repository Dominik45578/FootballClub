package com.polibuda.footballclub.user.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.*;
import jakarta.ws.rs.container.PreMatching;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;

import java.time.LocalDate;

@Builder
@Data
@AllArgsConstructor
@Validated
public class NewMemberRequestDTO {
    // Używamy Double wrapperów, bo pola mogą być opcjonalne (null)
    @DecimalMin(value = "100.0", message = "Wzrost musi być realny (min 100 cm)")
    @DecimalMax(value = "250.0", message = "Wzrost musi być realny (max 250 cm)")
    private Double height;

    @DecimalMin(value = "30.0", message = "Waga musi być realna (min 30 kg)")
    @DecimalMax(value = "200.0", message = "Waga musi być realna (max 200 kg)")
    private Double weight;

    @Pattern(regexp = "^\\+?[0-9]{9,15}$", message = "Niepoprawny format numeru telefonu")
    private String phoneNumber;

    @NotBlank
    @Size(min = 3,max = 32)
    private String firstName;

    @NotBlank
    @Size(min = 3,max = 32)
    private String lastName;

    @NotNull
    @Size(min=11, max=11)
    private String pesel;

    @NotNull
    private LocalDate birthDate;

    @AssertTrue(message = "Klub przyjmuje członków, którzy mają ukończone 5 lat")
    @JsonIgnore
    public boolean isAgeValid() {
        if (birthDate == null) {
            return true;
        }

        LocalDate fiveYearsAgo = LocalDate.now().minusYears(5);
        return !birthDate.isAfter(fiveYearsAgo);
    }

}
