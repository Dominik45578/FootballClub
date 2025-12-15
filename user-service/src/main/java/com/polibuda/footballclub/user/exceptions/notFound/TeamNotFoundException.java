package com.polibuda.footballclub.user.exceptions.notFound;

public class TeamNotFoundException extends ResourceNotFoundException {
    public TeamNotFoundException(Long id) {
        super("Team with ID " + id + " not found.");
    }
    public TeamNotFoundException(String code) {
        super("Team with code " + code + " not found.");
    }
}

