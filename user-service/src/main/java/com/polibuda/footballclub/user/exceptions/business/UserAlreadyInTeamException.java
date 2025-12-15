package com.polibuda.footballclub.user.exceptions.business;

public class UserAlreadyInTeamException extends BusinessLogicException {
    public UserAlreadyInTeamException(String teamCode) {
        super("User is already a member (or pending) of team: " + teamCode);
    }
}

