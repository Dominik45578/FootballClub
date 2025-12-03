package com.polibuda.footballclub.identify.service.password;

import com.polibuda.footballclub.common.actions.UserAccountAction;
import com.polibuda.footballclub.common.dto.*;
import com.polibuda.footballclub.identify.EmailTemplates;
import com.polibuda.footballclub.identify.RegisterCodeGenerator;
import com.polibuda.footballclub.identify.entity.User;
import com.polibuda.footballclub.identify.repository.UserRepository;
import com.polibuda.footballclub.identify.service.RabbitService;
import com.polibuda.footballclub.identify.service.redis.RedisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordServiceImpl implements PasswordService {

    private final UserRepository userRepository;
    private final RedisService redisService;
    private final RabbitService rabbitService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public ResetPasswordResponse initiatePasswordReset(ResetPasswordRequest request) {
        try {
            User user = userRepository.findByEmail(request.getEmail()).orElse(null);
            // Security: Nie rzucamy błędu jeśli user nie istnieje, by nie zdradzać bazy (User Enumeration Attack prevention)
            if (user != null) {
                String code = RegisterCodeGenerator.generateUrlSafeToken();
                redisService.saveCode(user.getEmail(), code, UserAccountAction.PASSWORD_RESET);

                String content = EmailTemplates.generatePasswordResetEmail(user.getUsername(), code);
                rabbitService.sendMessageWithVerificationCode(user.getEmail(), content, "Reset your password");
                log.info("Reset password code sent to: {}", request.getEmail());
            }
            return ResetPasswordResponse.builder().message("If email exists, code was sent").build();
        } catch (Exception e) {
            log.error("Error initiating password reset", e);
            return ResetPasswordResponse.builder().message("Error processing request").build();
        }
    }

    @Override
    @Transactional
    public NewPasswordResponse changePassword(NewPasswordRequest request) {
        try {
            // 1. Walidacja zgodności haseł
            if (!request.getPassword().equals(request.getConfirmNewPassword())) {
                return NewPasswordResponse.builder().status(false).message("Passwords do not match").build();
            }

            // 2. Walidacja kodu z Redisa
            if (!redisService.validateCode(request.getEmail(), request.getCode(), UserAccountAction.PASSWORD_RESET)) {
                return NewPasswordResponse.builder().status(false).message("Invalid or expired code").build();
            }

            // 3. Pobranie użytkownika
            User user = userRepository.findByEmail(request.getEmail()).orElse(null);
            if (user == null) {
                return NewPasswordResponse.builder().status(false).message("User not found").build();
            }

            // 4. Sprawdzenie czy nowe hasło różni się od starego
            if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                return NewPasswordResponse.builder().status(false).message("New password cannot be the same as old").build();
            }

            // 5. Zmiana hasła i zapis
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            userRepository.save(user);

            // 6. Usunięcie kodu z Redisa
            redisService.deleteCode(request.getEmail(), UserAccountAction.PASSWORD_RESET);

            // 7. Wysyłka alertu bezpieczeństwa
            sendSecurityAlert(user);

            log.info("Password changed successfully for user: {}", user.getEmail());
            return NewPasswordResponse.builder().status(true).message("Password changed successfully").build();

        } catch (Exception e) {
            log.error("Error changing password", e);
            return NewPasswordResponse.builder().status(false).message("Internal error").build();
        }
    }

    /**
     * Metoda pomocnicza do wysyłania alertu bezpieczeństwa
     */
    private void sendSecurityAlert(User user) {
        try {
            String alertContent = EmailTemplates.generatePasswordChangedAlertEmail(user.getUsername());
            rabbitService.sendMessageWithVerificationCode(
                    user.getEmail(),
                    alertContent,
                    "Security Alert: Password Changed"
            );
        } catch (Exception e) {
            // Nie chcemy, aby błąd wysyłki maila cofnął transakcję zmiany hasła,
            // więc tylko logujemy błąd.
            log.error("Failed to send security alert email to user: {}", user.getEmail(), e);
        }
    }
}