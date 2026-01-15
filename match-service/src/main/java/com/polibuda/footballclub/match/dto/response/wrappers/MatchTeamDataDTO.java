package com.polibuda.footballclub.match.dto.response.wrappers;

import com.polibuda.footballclub.match.dto.fromMatchService.MatchMemberDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchTeamDataDTO {
    private Long id;
    private String name;
    
    // Flaga kluczowa dla frontendu: czy to "mój" klub?
    private boolean isInternal;
    
    // Opcjonalnie: URL do logo (jeśli będziesz przechowywać)
    private String logoUrl; 

    // Lista zawodników (dla drużyny zewnętrznej może być pusta, jeśli nie pobieramy detali)
    @Builder.Default
    private List<MatchMemberDto> squad = Collections.emptyList();
}