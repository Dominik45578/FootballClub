package com.polibuda.footballclub.football_external_data.dto.clubs;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClubResponseWrapperDTO {

    @JsonProperty("team")
    private TeamSummaryDataDTO team;

    @JsonProperty("venue")
    private VenueSummaryDataDTO venue;
}