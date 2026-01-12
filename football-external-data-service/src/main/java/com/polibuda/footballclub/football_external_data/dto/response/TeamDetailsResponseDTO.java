package com.polibuda.footballclub.football_external_data.dto.response;

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