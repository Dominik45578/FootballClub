package com.polibuda.footballclub.match.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMatchRequestDTO {

    @NotNull(message = "ID naszej drużyny jest wymagane")
    private Long internalTeamId;

    @NotNull(message = "ID drużyny zewnętrznej jest wymagane")
    private Long externalTeamId;

    @NotNull(message = "Data meczu jest wymagana")
    private LocalDateTime matchDate;

    // Czy gramy u siebie? (Domyślnie true)
    @Builder.Default
    private Boolean isHome = true;
}