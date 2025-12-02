package com.polibuda.footballclub.identify.service.actiavte;

import com.polibuda.footballclub.common.actions.NotificationAction;
import com.polibuda.footballclub.common.dto.ActivateRequest;
import com.polibuda.footballclub.common.dto.ActivateResponse;
import com.polibuda.footballclub.common.dto.LoginRequest;
import com.polibuda.footballclub.identify.EmailTemplates;
import com.polibuda.footballclub.identify.RegisterCodeGenerator;
import com.polibuda.footballclub.identify.entity.User;
import com.polibuda.footballclub.identify.redis.RedisUser;
import com.polibuda.footballclub.identify.repository.RedisUserRepository;
import com.polibuda.footballclub.identify.repository.UserRepository;
import com.polibuda.footballclub.identify.service.RabbitService;
import com.polibuda.footballclub.identify.service.user.UserService;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
@AllArgsConstructor
public class ActivateServiceImpl implements ActivateService {

    private final UserRepository userRepository;
    private final RedisUserRepository redisUserRepository;
    private final RabbitService rabbitService;
    private final String subject = "Verify your account";

    @Override
    @Transactional
    public boolean activate(ActivateRequest request) {
        String id = RedisUser.generateId(request.getEmail(), NotificationAction.VERIFY_USER_ACCOUNT);
        return redisUserRepository.findById(id)
                .filter(ru -> ru.getVerificationCode().equals(request.getCode()))
                .map(ru -> {
                    userRepository.findByEmail(request.getEmail())
                            .ifPresent(user -> {
                                user.setEnabled(true);
                                user.setAccountNonLocked(true);
                                log.info("User account enabled and unlocked: {}", user);
                            });
                    redisUserRepository.delete(ru);
                    log.info("RedisUser deleted: {}", ru);
                    String temp = EmailTemplates.generateAccountActivatedEmail(request.getEmail());
                    rabbitService.sendMessageWithVerificationCode(
                            ru.getEmail(),temp,"Account verified successfully!"
                    );
                    return true;
                })
                .orElseGet(() -> {
                    log.warn("Activation failed for email: {}", request.getEmail());
                    return false;
                });
    }

    @Override
    public String generateCode(String email) {
        String id = RedisUser.generateId(email, NotificationAction.VERIFY_USER_ACCOUNT);
        return userRepository.findByEmail(email)
                .filter(u -> !u.getEnabled())
                .map(u -> {
                    RedisUser ru = RedisUser.builder()
                            .id(id)
                            .email(email)
                            .verificationCode(RegisterCodeGenerator.generateUrlSafeToken())
                            .build();
                    redisUserRepository.save(ru);
                    log.info("New code generated for user: {}", ru.getEmail());
                    String temp = EmailTemplates.generateWelcomeEmail(ru.getEmail(), ru.getVerificationCode());
                    rabbitService.sendMessageWithVerificationCode(ru.getEmail(), temp, subject);
                    return ru.getVerificationCode();
                })
                .orElseThrow(() -> new RuntimeException("Account already verified"));
    }

    @Override
    public void sendMail(LoginRequest request) {
        String temp = EmailTemplates.generateAccountNotActiveEmail(request.getEmail());
        rabbitService.sendMessageWithVerificationCode(
                request.getEmail(),temp,"Account not active"
        );
    }
}
