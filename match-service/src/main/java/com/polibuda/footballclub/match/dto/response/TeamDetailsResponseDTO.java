package com.polibuda.footballclub.match.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class TeamDetailsResponseDTO {
    private TeamBasicResponseDTO teamInfo;
    private VenueResponseDTO venue;
    private List<PlayerResponseDTO> squad;
}