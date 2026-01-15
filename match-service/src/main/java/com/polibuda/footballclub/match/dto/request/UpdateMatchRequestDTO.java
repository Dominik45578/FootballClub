package com.polibuda.footballclub.match.dto.request;

import com.polibuda.footballclub.match.MatchStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMatchRequestDTO {
    // Pola są opcjonalne - aktualizujemy tylko to, co przesłano (PATCH)
    private LocalDateTime matchDate;
    private Boolean isHome;
    private MatchStatus status;
}