package com.polibuda.footballclub.football_external_data.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VenueResponseDTO {
    private Long id;
    private String name;
    private String address;
    private String city;
    private Long capacity;
    private String surface;
    private String logoUrl;
}