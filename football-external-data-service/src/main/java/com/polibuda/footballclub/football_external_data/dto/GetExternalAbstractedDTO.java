package com.polibuda.footballclub.football_external_data.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.Map;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public abstract class GetExternalAbstractedDTO {

    @JsonProperty("get")
    private String get;

    @JsonProperty("parameters")
    private Map<String, String> parameters;

    @JsonProperty("results")
    private int results;

    @JsonProperty("paging")
    private Map<String, Integer> paging;

    @JsonProperty("errors")
    private Object errors;
}