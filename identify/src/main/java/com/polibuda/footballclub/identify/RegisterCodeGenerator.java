package com.polibuda.footballclub.identify;

import java.security.SecureRandom;
import java.util.Base64;

public class RegisterCodeGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int length = 6;

    public static String generateUrlSafeToken(int byteLength) {
        byte[] bytes = new byte[byteLength];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
    public static String generateUrlSafeToken() {
        return generateUrlSafeToken(length);
    }
}
