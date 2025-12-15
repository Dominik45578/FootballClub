package com.polibuda.footballclub.user.exceptions.notFound;

// Konkretne implementacje
public class MemberNotFoundException extends ResourceNotFoundException {
    public MemberNotFoundException(Long id) {
        super("Member with ID " + id + " not found.");
    }
    public MemberNotFoundException(String identifier) {
        super("Member with identifier " + identifier + " not found.");
    }
}

