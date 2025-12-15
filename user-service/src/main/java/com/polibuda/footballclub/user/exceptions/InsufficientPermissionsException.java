package com.polibuda.footballclub.user.exceptions;

import com.polibuda.footballclub.user.exceptions.notFound.FootballClubException;

public class InsufficientPermissionsException extends FootballClubException {
    public InsufficientPermissionsException(String action) {
        super("You do not have permission to perform this action: " + action);
    }
}