package com.polibuda.footballclub.football_external_data.mapper;

import com.polibuda.footballclub.football_external_data.dto.response.PlayerResponseDTO;
import com.polibuda.footballclub.football_external_data.dto.squads.PlayerDataDTO;
import com.polibuda.footballclub.football_external_data.entity.PlayerEntity;
import org.springframework.stereotype.Component;

@Component
public class PlayerMapper implements BaseMapper<PlayerEntity, PlayerResponseDTO> {

    @Override
    public PlayerResponseDTO toDto(PlayerEntity entity) {
        if (entity == null) return null;
        return PlayerResponseDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .age(entity.getAge())
                .number(entity.getNumber())
                .position(entity.getPosition() != null ? entity.getPosition().name() : null)
                .photoUrl(entity.getPhoto())
                .build();
    }

    @Override
    public PlayerEntity toEntity(PlayerResponseDTO dto) {
        if (dto == null) return null;
        return PlayerEntity.builder()
                .id(dto.getId())
                .name(dto.getName())
                .age(dto.getAge())
                .number(dto.getNumber())
                .photo(dto.getPhotoUrl())
                .build();
    }

    public PlayerEntity toEntity(PlayerDataDTO dto) {
        if (dto == null) return null;
        return PlayerEntity.builder()
                .id(dto.getId())
                .name(dto.getName())
                .age(dto.getAge())
                .number(dto.getNumber())
                .position(dto.getPosition())
                .photo(dto.getPhoto())
                .build();
    }
}