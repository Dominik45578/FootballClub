package com.polibuda.footballclub.football_external_data.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlayerResponseDTO {
    private Long id;
    private String name;
    private int age;
    private int number;
    private String position;
    private String photoUrl;
}