package com.polibuda.footballclub.match.dto.response;

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