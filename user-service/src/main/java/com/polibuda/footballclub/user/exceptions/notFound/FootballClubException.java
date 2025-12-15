package com.polibuda.footballclub.user.exceptions.notFound;

import lombok.Getter;

public abstract class FootballClubException extends RuntimeException {
    @Getter
    private final String messageKey; // Opcjonalnie do internacjonalizacji (i18n)

    public FootballClubException(String message) {
        super(message);
        this.messageKey = null;
    }
}