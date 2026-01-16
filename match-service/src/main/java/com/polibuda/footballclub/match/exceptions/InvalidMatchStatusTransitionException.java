package com.polibuda.footballclub.match.exceptions;

public class InvalidMatchStatusTransitionException extends MatchSerwisExceptions {
    public InvalidMatchStatusTransitionException(String message) {
        super(message);
    }
}