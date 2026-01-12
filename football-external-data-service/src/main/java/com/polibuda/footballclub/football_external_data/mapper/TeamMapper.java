package com.polibuda.footballclub.football_external_data.mapper;

import com.polibuda.footballclub.football_external_data.dto.response.TeamBasicResponseDTO;
import com.polibuda.footballclub.football_external_data.dto.clubs.TeamSummaryDataDTO;
import com.polibuda.footballclub.football_external_data.entity.TeamEntity;
import org.springframework.stereotype.Component;

@Component
public class TeamMapper implements BaseMapper<TeamEntity, TeamBasicResponseDTO> {

    @Override
    public TeamBasicResponseDTO toDto(TeamEntity entity) {
        if (entity == null) return null;
        return TeamBasicResponseDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .code(entity.getCode())
                .country(entity.getCountry())
                .founded(entity.getFounded())
                .national(entity.isNational())
                .logoUrl(entity.getLogoUrl())
                .build();
    }

    @Override
    public TeamEntity toEntity(TeamBasicResponseDTO dto) {
        if (dto == null) return null;
        return TeamEntity.builder()
                .id(dto.getId())
                .name(dto.getName())
                .code(dto.getCode())
                .country(dto.getCountry())
                .founded(dto.getFounded())
                .national(dto.isNational())
                .logoUrl(dto.getLogoUrl())
                .build();
    }

    public TeamEntity toEntity(TeamSummaryDataDTO dto) {
        if (dto == null) return null;
        return TeamEntity.builder()
                .id(dto.getId())
                .name(dto.getName())
                .code(dto.getCode())
                .country(dto.getCountry())
                .founded(dto.getFounded())
                .national(dto.isNational())
                .logoUrl(dto.getLogoUrl())
                .build();
    }

    public TeamSummaryDataDTO toSummaryDto(TeamEntity entity) {
        if (entity == null) return null;
        return TeamSummaryDataDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .code(entity.getCode())
                .country(entity.getCountry())
                .founded(entity.getFounded())
                .national(entity.isNational())
                .logoUrl(entity.getLogoUrl())
                .build();
    }
}