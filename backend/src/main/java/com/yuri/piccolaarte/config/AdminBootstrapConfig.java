package com.yuri.piccolaarte.config;

import com.yuri.piccolaarte.entities.AppUser;
import com.yuri.piccolaarte.entities.UserRole;
import com.yuri.piccolaarte.repositories.AppUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Configuration
@ConditionalOnProperty(
        prefix = "app.admin.bootstrap",
        name = "enabled",
        havingValue = "true"
)
public class AdminBootstrapConfig {

    @Bean
    public ApplicationRunner createInitialAdmin(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.bootstrap.email}") String email,
            @Value("${app.admin.bootstrap.password}") String password
    ) {
        return args -> {
            String normalizedEmail = email.strip().toLowerCase(Locale.ROOT);

            if (normalizedEmail.isBlank()) {
                throw new IllegalStateException(
                        "Admin email is required when admin bootstrap is enabled."
                );
            }

            if (appUserRepository.existsByEmail(normalizedEmail)) {
                return;
            }

            int passwordBytes = password.getBytes(StandardCharsets.UTF_8).length;

            if (password.length() < 12 || passwordBytes > 72) {
                throw new IllegalStateException(
                        "Admin password must contain at least 12 characters and at most 72 UTF-8 bytes."
                );
            }

            AppUser admin = new AppUser(
                    normalizedEmail,
                    passwordEncoder.encode(password),
                    UserRole.ADMIN
            );

            appUserRepository.saveAndFlush(admin);
        };
    }
}