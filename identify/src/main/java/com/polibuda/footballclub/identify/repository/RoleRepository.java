package com.polibuda.footballclub.identify.repository;

import com.polibuda.footballclub.identify.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name);
    Optional<Role> findByNameIgnoreCase(String name);
    Optional<Role> findById(Long id);
    List<Role> findByNameIn(Collection<String> names);
}
