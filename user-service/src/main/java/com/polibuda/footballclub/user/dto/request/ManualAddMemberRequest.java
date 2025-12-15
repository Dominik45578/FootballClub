package com.polibuda.footballclub.user.dto.request;

import com.polibuda.footballclub.common.database.TeamRole;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualAddMemberRequest {

    @NotNull(message = "ID kandydata jest wymagane")
    private Long memberId;

    // Opcjonalnie: Trener może od razu nadać rolę (np. Bramkarz) przy dodawaniu
    private Set<TeamRole> initialRoles;
}