package com.polibuda.footballclub.gateway.model;


import java.util.Set;


public record UserContext(String userId, String username, Set<String> roles, Set<String> scopes) { }