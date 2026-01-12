package com.polibuda.footballclub.football_external_data.dto.squads;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.polibuda.footballclub.football_external_data.dto.GetExternalAbstractedDTO;
import com.polibuda.footballclub.football_external_data.model.FieldPosition;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

@SuperBuilder
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class GetSquadDataDTO extends GetExternalAbstractedDTO {
    @JsonProperty("response")
   List<PlayerResponseWrapperDTO> response;
}
