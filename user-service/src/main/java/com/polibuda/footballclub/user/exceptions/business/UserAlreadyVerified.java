package com.polibuda.footballclub.user.exceptions.business;

public class UserAlreadyVerified extends BusinessLogicException {
    public UserAlreadyVerified(Long code) {
        super("User already verified :" + code);
    }
    public UserAlreadyVerified(String code) {
        super("User already verified :" + code);
    }
}
