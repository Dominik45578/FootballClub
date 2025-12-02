package com.polibuda.footballclub.identify.service.actiavte;

import com.polibuda.footballclub.common.actions.NotificationAction;
import com.polibuda.footballclub.common.dto.ActivateRequest;
import com.polibuda.footballclub.common.dto.ActivateResponse;
import com.polibuda.footballclub.identify.EmailTemplates;
import com.polibuda.footballclub.identify.RegisterCodeGenerator;
import com.polibuda.footballclub.identify.repository.UserRepository;
import com.polibuda.footballclub.identify.service.RabbitService;
import com.polibuda.footballclub.identify.service.redis.RedisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivateServiceImpl implements ActivateService {

    private final UserRepository userRepository;
    private final RedisService redisService;
    private final RabbitService rabbitService;

    @Override
    @Transactional
    public ActivateResponse activateAccount(ActivateRequest request) {
        boolean isValid = redisService.validateCode(request.getEmail(), request.getCode(), NotificationAction.VERIFY_USER_ACCOUNT);

        if (!isValid) {
            log.warn("Invalid activation code for: {}", request.getEmail());
            return ActivateResponse.builder()
                    .success(false)
                    .message("Invalid code or email")
                    .timestamp(LocalDateTime.now())
                    .build();
        }

        return userRepository.findByEmail(request.getEmail())
                .map(user -> {
                    user.setEnabled(true);
                    user.setAccountNonLocked(true);
                    userRepository.save(user);

                    redisService.deleteCode(request.getEmail(), NotificationAction.VERIFY_USER_ACCOUNT);

                    String emailContent = EmailTemplates.generateAccountActivatedEmail(user.getUsername());
                    rabbitService.sendMessageWithVerificationCode(user.getEmail(), emailContent, "Account verified successfully!");

                    log.info("User activated successfully: {}", user.getEmail());
                    return ActivateResponse.builder()
                            .success(true)
                            .message("Account activated successfully")
                            .timestamp(LocalDateTime.now())
                            .build();
                })
                .orElseGet(() -> ActivateResponse.builder()
                        .success(false)
                        .message("User not found")
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    @Override
    public boolean sendActivationCode(String email, String username) {
        try {
            String code = RegisterCodeGenerator.generateUrlSafeToken();
            redisService.saveCode(email, code, NotificationAction.VERIFY_USER_ACCOUNT);

            String content = EmailTemplates.generateEmailWithActivationCode(username, code);
            rabbitService.sendMessageWithVerificationCode(email, content, "Verify your account");
            return true;
        } catch (Exception e) {
            log.error("Error sending activation code to: {}", email, e);
            return false;
        }
    }

    @Override
    public void sendAccountNotVerifiedReminder(String email, String username) {
        String content = EmailTemplates.generateAccountNotActiveEmail(username);
        rabbitService.sendMessageWithVerificationCode(email, content, "Action Required: Verify Account");
    }
}