package com.polibuda.footballclub.user.dto.request;

import com.polibuda.footballclub.common.database.TeamCategory;
import com.polibuda.footballclub.common.database.TeamStatus;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;


@Builder
@Data
@AllArgsConstructor
public class AddTeamRequest {
    @NotBlank(message = "Nazwa teamu jest wymagana")
    @Size(min = 5 , max = 128)
    private String name;

    @NotNull(message = "Category is required")
    private TeamCategory category;

    @NotBlank(message = "Team code is required")
    @Size(min = 6 , max = 32, message = "Code must be between 6 and 32 signs")
    private String code;

    @NotNull
    private TeamStatus status;

    @NotBlank(message = "Team description is required and must be between 50 and 4095 signs")
    @Max(4095)
    @Min(10)
    private String description;
}
