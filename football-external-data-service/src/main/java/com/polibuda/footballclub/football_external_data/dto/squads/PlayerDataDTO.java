package com.polibuda.footballclub.football_external_data.dto.squads;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.polibuda.footballclub.football_external_data.model.FieldPosition;
import lombok.*;


@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PlayerDataDTO {
    @JsonProperty("id")
    private long id;

    @JsonProperty("name")
    private String name;

    @JsonProperty("age")
    private int age;

    @JsonProperty("number")
    private int number;

    @JsonProperty("position")
    private FieldPosition position;

    @JsonProperty("photo")
    private String  photo;
}
