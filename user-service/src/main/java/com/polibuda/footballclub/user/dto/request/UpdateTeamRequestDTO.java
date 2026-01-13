package com.polibuda.footballclub.user.dto.request;

import com.polibuda.footballclub.common.database.TeamCategory;
import com.polibuda.footballclub.common.database.TeamStatus;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class UpdateTeamRequestDTO {
    private Long id;

    @Size(min = 5, max = 128)
    private String name;

    private TeamCategory category;

    @Size(min=1, max = 4095)
    private String description;

    private TeamStatus status;
}
