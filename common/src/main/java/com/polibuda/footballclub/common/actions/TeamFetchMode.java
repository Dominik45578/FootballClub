package com.polibuda.footballclub.common.actions;

public enum TeamFetchMode {
    ALL_TEAMS,      // Wszystkie dostępne zespoły (np. do wyszukiwarki)
    MY_TEAMS,       // Zespoły, w których jestem (niezależnie od roli)
    SPECIFIC_TEAM   // Konkretny zespół wskazany ID (np. szczegóły)
}