package com.polibuda.footballclub.user;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/user")
public class TempController {

    @GetMapping("/temp")
    public Map<String, String> temp(HttpServletRequest request) {
        Map<String, String> headers = new HashMap<>();

        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String key = headerNames.nextElement();
            String value = request.getHeader(key);
            headers.put(key, value);
        }

        // Dodatkowo logujemy w konsoli serwisu User, żebyś widział to w logach dockera
        System.out.println("--- OTRZYMANE NAGŁÓWKI W USER-SERVICE ---");
        headers.forEach((k, v) -> System.out.println(k + ": " + v));
        System.out.println("-----------------------------------------");

        return headers;
    }
}