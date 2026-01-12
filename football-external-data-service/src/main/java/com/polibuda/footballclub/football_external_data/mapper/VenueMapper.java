package com.polibuda.footballclub.football_external_data.mapper;

import com.polibuda.footballclub.football_external_data.dto.response.VenueResponseDTO;
import com.polibuda.footballclub.football_external_data.dto.clubs.VenueSummaryDataDTO;
import com.polibuda.footballclub.football_external_data.entity.VenueEntity;
import org.springframework.stereotype.Component;

@Component
public class VenueMapper implements BaseMapper<VenueEntity, VenueResponseDTO> {

    @Override
    public VenueResponseDTO toDto(VenueEntity entity) {
        if (entity == null) return null;
        return VenueResponseDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .address(entity.getAddress())
                .city(entity.getCity())
                .capacity(entity.getCapacity())
                .surface(entity.getSurface())
                .logoUrl(entity.getLogoUrl())
                .build();
    }

    @Override
    public VenueEntity toEntity(VenueResponseDTO dto) {
        if (dto == null) return null;
        return VenueEntity.builder()
                .id(dto.getId())
                .name(dto.getName())
                .address(dto.getAddress())
                .city(dto.getCity())
                .capacity(dto.getCapacity())
                .surface(dto.getSurface())
                .logoUrl(dto.getLogoUrl())
                .build();
    }

    public VenueEntity toEntity(VenueSummaryDataDTO dto) {
        if (dto == null) return null;
        return VenueEntity.builder()
                .id(dto.getId())
                .name(dto.getName())
                .address(dto.getAddress())
                .city(dto.getCity())
                .capacity(dto.getCapacity())
                .surface(dto.getSurface())
                .logoUrl(dto.getLogoUrl())
                .build();
    }
}