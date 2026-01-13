package com.polibuda.footballclub.user.dto.request;

import com.polibuda.footballclub.common.database.TeamCategory;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;


@Builder
@Data
@AllArgsConstructor
public class AddTeamRequest {
    @NotBlank(message = "Nazwa teamu jest wymagana")
    String name;

    @NotNull(message = "Category is required")
    TeamCategory category;

    @NotBlank(message = "Team code is required")
    @Size(min = 6 , max = 32, message = "Code must be between 6 and 16 signs")
    String code;

    @NotBlank(message = "Team description is required and must be between 50 and 4095 signs")
    @Max(4095)
    @Min(50)
    String description;
}
