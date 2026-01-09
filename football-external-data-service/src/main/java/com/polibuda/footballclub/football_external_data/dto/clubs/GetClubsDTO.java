package com.polibuda.footballclub.football_external_data.dto.clubs;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.polibuda.footballclub.football_external_data.dto.GetExternalAbstractedDTO;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties(ignoreUnknown = true)
public class GetClubsDTO extends GetExternalAbstractedDTO {

    @JsonProperty("response")
    private List<ClubResponseWrapperDTO> response;
}