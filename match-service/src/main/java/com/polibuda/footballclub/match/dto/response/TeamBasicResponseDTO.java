package com.polibuda.footballclub.match.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TeamBasicResponseDTO {
    private Long id;
    private String name;
    private String code;
    private String country;
    private Integer founded;
    private boolean national;
    private String logoUrl;
}