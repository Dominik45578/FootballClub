package com.polibuda.footballclub.common.database;

import lombok.ToString;

@ToString
public enum TeamStatus {
    ACTIVE,
    ARCHIVED,
    SUSPENDED, // opcjonalnie, na przyszłość`
    CREATED
}