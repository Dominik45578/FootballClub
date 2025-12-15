package com.polibuda.footballclub.user.exceptions.notFound;

// Baza dla wszystkich błędów 404
public abstract class ResourceNotFoundException extends FootballClubException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
