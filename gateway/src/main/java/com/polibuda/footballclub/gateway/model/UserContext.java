package com.polibuda.footballclub.gateway.model;


import java.util.Set;


public record UserContext(String userId, String username, String email,Set<String> roles, Set<String> scopes, boolean activated, String blocked) { }