package com.polibuda.footballclub.user.exceptions.business;

import com.polibuda.footballclub.user.exceptions.notFound.FootballClubException;

public class TeamAlreadyExistExceptions extends BusinessLogicException {
    public TeamAlreadyExistExceptions() {
        this("Team already exists");
    }
    public TeamAlreadyExistExceptions(String message) {
        super(message);
    }
}
