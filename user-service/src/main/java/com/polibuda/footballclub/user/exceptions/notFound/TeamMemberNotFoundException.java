package com.polibuda.footballclub.user.exceptions.notFound;

public class TeamMemberNotFoundException extends ResourceNotFoundException {
    public TeamMemberNotFoundException(Long teamId, Long memberId) {
        super("Member " + memberId + " is not part of team " + teamId);
    }
}