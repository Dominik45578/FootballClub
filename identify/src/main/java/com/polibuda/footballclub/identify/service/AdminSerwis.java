package com.polibuda.footballclub.identify.service;

import com.polibuda.footballclub.identify.EmailTemplates;
import com.polibuda.footballclub.identify.entity.User;
import com.polibuda.footballclub.identify.model.SecurityUser;
import com.polibuda.footballclub.identify.repository.RoleRepository;
import com.polibuda.footballclub.identify.repository.UserRepository;
import com.polibuda.footballclub.identify.service.redis.RedisService;
import com.polibuda.footballclub.identify.service.user.UserService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
@Slf4j
public class AdminSerwis {
    RedisService redisService;
    RabbitService rabbitService;
    UserService userService;

    public boolean blockUser(Long userId) {
        try {
            User user = userService.findById(userId);
            user.setAccountNonLocked(false);
            userService.save(user);
            redisService.blockUser(userId);
            rabbitService.sendMessageWithVerificationCode(user.getEmail(),
                    EmailTemplates.generateAccountBlockedEmail(
                            user.getUsername()
                    ), "Konto zostało zablokowane przez administratora"

            );
            return true;
        }catch (Exception e){
            log.error("User was not blocked by gods reason");
            return false;
        }
    }

    public boolean unlockUser(Long userId) {
        try {
            User user = userService.findById(userId);
            user.setAccountNonLocked(true);
            user.setCredentialsNonExpired(true);
            userService.save(user);
            redisService.unblockUser(userId);
            rabbitService.sendMessageWithVerificationCode(user.getEmail(),
                    EmailTemplates.generateAccountUnlockedEmail(
                            user.getUsername()
                    ), "Konto zostało odblokowane przez administratora"

            );
            return true;
        }catch (Exception e){
            log.error("User was not unblocked by gods reason");
            return false;
        }
    }






}
