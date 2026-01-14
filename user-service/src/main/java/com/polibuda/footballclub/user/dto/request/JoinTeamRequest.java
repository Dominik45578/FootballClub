package com.polibuda.footballclub.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JoinTeamRequest {

    @NotBlank(message = "Kod zespołu nie może być pusty")
    @Size(min = 6, max = 32, message = "Kod zespołu musi mieć od 6 do 32 znaków")
    private String teamCode;
}