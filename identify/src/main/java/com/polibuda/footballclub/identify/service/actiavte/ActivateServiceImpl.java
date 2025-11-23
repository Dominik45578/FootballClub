package com.polibuda.footballclub.identify.service.actiavte;

import com.polibuda.footballclub.common.dto.ActivateRequest;
import com.polibuda.footballclub.common.dto.ActivateResponse;
import com.polibuda.footballclub.identify.RegisterCodeGenerator;
import com.polibuda.footballclub.identify.entity.User;
import com.polibuda.footballclub.identify.redis.RedisUser;
import com.polibuda.footballclub.identify.repository.RedisUserRepository;
import com.polibuda.footballclub.identify.repository.UserRepository;
import com.polibuda.footballclub.identify.service.user.UserService;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
@AllArgsConstructor
public class ActivateServiceImpl implements ActivateService {

    private final UserRepository userRepository;
    private final RedisUserRepository redisUserRepository;

    @Override
    @Transactional
    public boolean activate(ActivateRequest request) {
        return redisUserRepository.findByEmail(request.getEmail())
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
                    return true;
                })
                .orElseGet(() -> {
                    log.warn("Activation failed for email: {}", request.getEmail());
                    return false;
                });
    }

    @Override
    public String generateCode(String email) {
        return userRepository.findByEmail(email)
                .filter(u -> !u.getEnabled())
                .map(u -> {
                    RedisUser ru = RedisUser.builder()
                            .email(email)
                            .verificationCode(RegisterCodeGenerator.generateUrlSafeToken())
                            .build();
                    redisUserRepository.save(ru);
                    log.info("New code generated for user: {}", email);
                    return ru.getVerificationCode();
                })
                .orElseThrow(() -> new RuntimeException("Account already verified"));
    }
}
