package com.polibuda.footballclub.user.exceptions.business;

public class InvalidTeamCodeException extends BusinessLogicException {
    public InvalidTeamCodeException(String code) {
        super("Provided team code is invalid or does not exist: " + code);
    }
}