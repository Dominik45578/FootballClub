package com.polibuda.footballclub.user.exceptions.business;

import com.polibuda.footballclub.user.exceptions.notFound.FootballClubException;

// Baza dla błędów logicznych (np. naruszenie zasad biznesowych)
public abstract class BusinessLogicException extends FootballClubException {
    public BusinessLogicException(String message) {
        super(message);
    }
}

