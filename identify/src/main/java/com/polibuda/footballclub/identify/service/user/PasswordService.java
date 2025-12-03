package com.polibuda.footballclub.identify.service.user;

import com.polibuda.footballclub.common.actions.UserAccountAction;
import com.polibuda.footballclub.common.dto.*;
import com.polibuda.footballclub.identify.EmailTemplates;
import com.polibuda.footballclub.identify.RegisterCodeGenerator;
import com.polibuda.footballclub.identify.entity.User;
import com.polibuda.footballclub.identify.service.RabbitService;
import com.polibuda.footballclub.identify.service.redis.RedisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordService {

    private final UserService userService; // lub UserRepository, zależnie od preferencji
    private final RedisService redisService;
    private final RabbitService rabbitService;
    private final PasswordEncoder passwordEncoder;

    public boolean initiatePasswordReset(ResetPasswordRequest request) {
        try {
            // Sprawdzamy czy user istnieje, ale nie rzucamy błędu jeśli nie (security practice)
            User user = userService.findByEmail(request.getEmail());
            if (user != null) {
                String code = RegisterCodeGenerator.generateUrlSafeToken();
                redisService.saveCode(user.getEmail(), code, UserAccountAction.PASSWORD_RESET);
                
                String emailContent = EmailTemplates.generatePasswordResetEmail(user.getEmail(), code);
                rabbitService.sendMessageWithVerificationCode(user.getEmail(), emailContent, "Reset your password");
                log.info("Password reset code sent to: {}", user.getEmail());
            }
            return true; // Zawsze zwracamy true, żeby nie zdradzać czy email istnieje
        } catch (Exception e) {
            log.error("Error initiating password reset for: {}", request.getEmail(), e);
            return false;
        }
    }

    @Transactional
    public NewPasswordResponse changePassword(NewPasswordRequest request) {
        try {
            // 1. Walidacja haseł
            if (!request.getPassword().equals(request.getConfirmNewPassword())) {
                return NewPasswordResponse.builder().status(false).message("Passwords do not match").build();
            }

            // 2. Walidacja kodu w Redis
            boolean isCodeValid = redisService.validateCode(request.getEmail(), request.getCode(), UserAccountAction.PASSWORD_RESET);
            if (!isCodeValid) {
                return NewPasswordResponse.builder().status(false).message("Invalid or expired code").build();
            }

            // 3. Pobranie usera
            User user = userService.findByEmail(request.getEmail());
            if (user == null) {
                return NewPasswordResponse.builder().status(false).message("User not found").build();
            }

            // 4. Sprawdzenie czy nowe hasło różni się od starego
            if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                return NewPasswordResponse.builder().status(false).message("New password cannot be the same as old password").build();
            }

            // 5. Zmiana hasła i czyszczenie Redis
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            userService.save(user); // Zakładam że userService ma save, lub użyj repo
            
            redisService.deleteCode(request.getEmail(), UserAccountAction.PASSWORD_RESET);
            
            log.info("Password successfully changed for user: {}", request.getEmail());
            return NewPasswordResponse.builder().status(true).message("Password changed successfully").build();

        } catch (Exception e) {
            log.error("Error changing password for: {}", request.getEmail(), e);
            return NewPasswordResponse.builder().status(false).message("Internal error").build();
        }
    }
}