package com.polibuda.footballclub.football_external_data.aop;

import com.polibuda.footballclub.common.actions.AuditActionType;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {
    AuditActionType actionType();
    String resourceName();
    String description() default "";
}