package com.polibuda.footballclub.football_external_data.mapper;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Generyczny interfejs mappera (DRY).
 * E - Entity
 * D - DTO
 */
public interface BaseMapper<E, D> {
    D toDto(E entity);
    
    // Opcjonalne w przypadku mappera tylko do odczytu (Response)
    E toEntity(D dto);

    default List<D> toDtoList(List<E> entities) {
        if (entities == null) return List.of();
        return entities.stream().map(this::toDto).collect(Collectors.toList());
    }

    default Set<E> toEntitySet(List<D> dtos) {
        if (dtos == null) return Set.of();
        return dtos.stream().map(this::toEntity).collect(Collectors.toSet());
    }
}